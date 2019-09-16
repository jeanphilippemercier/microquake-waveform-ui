import * as miniseed from 'seisplotjs-miniseed';
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';
import { globals } from '@src/globals';
import { Sensor } from '@interfaces/inventory.interface';
import { PickKey, Arrival, PredictedPickKey, WaveformSensor, PreferredRay } from '@interfaces/event.interface';

export default class WaveformUtil {

  // default data units conversion factor is from m to defaultUnits (mm)
  static convYUnits = 1000;
  static defaultUnits = 'mm';

  static findValue(obj, key, value) {
    return obj.find(v => v[key] === value);
  }

  static findNestedValue(obj, key, subkey, value, otherkey, othervalue) {
    return obj.find(v => (v[key] && v[key][subkey] &&
      v[key][subkey].toString() === value.toString() && v[otherkey] === othervalue));
  }

  static sortArrayBy(field, reverse, primer) {

    const key = primer ?
      function (x) { return primer(x[field]); } :
      function (x) { return x[field]; };

    reverse = !reverse ? 1 : -1;

    return function (a, b) {
      const A = key(a), B = key(b);
      return ((A < B) ? -1 : ((A > B) ? 1 : 0)) * [-1, 1][+!!reverse];
    };
  }

  static parseMiniseed(file, isContext): any {
    const records = miniseed.parseDataRecords(file);
    const channelsMap = miniseed.byChannel(records);
    const sensors = [];
    let zTime = null, timeOrigin = null;
    const eventData = {};
    let changetimeOrigin = false;
    channelsMap.forEach(function (this, value, key, map) {
      const sg = miniseed.createSeismogram(channelsMap.get(key));
      const header = channelsMap.get(key)[0].header;
      let valid = false;
      if (isContext || (sg.y().includes(NaN) === false && sg.y().some(el => el !== 0))) {
        valid = true;
      } else {
        // console.log('Warning - zero data channel: ' + sg.codes());
        // const tracesInfo = this.tracesInfo ?
        //   (this.tracesInfo.includes(sg.codes()) ? this.tracesInfo : this.tracesInfo + ', ' + sg.codes()) :
        //   'Zero traces: ' + sg.codes();
      }
      if (sg.start().isValid()) {
        if (!zTime) {
          zTime = moment(sg.start());  // starting time (use it up to tenth of second)
          zTime.millisecond(Math.floor(zTime.millisecond() / 100) * 100);
        } else {
          if (!sg.start().isSame(zTime, 'second')) {
            zTime = moment(moment.min(zTime, sg.start()));
            zTime.millisecond(Math.floor(zTime.millisecond() / 100) * 100);
            changetimeOrigin = true;
          }
        }
      } else {
        console.error(`Sensor ${sg.stationCode()} channel ${sg.channelCode()} timeOrigin not valid`);
        console.error(sg.start());
      }
      const seismogram = valid ? filter.rMean(sg) : sg;
      const channel = {};
      channel['code_id'] = isContext ? sg.codes() + '...CONTEXT' : sg.codes();
      channel['sensor_code'] = sg.stationCode();
      channel['channel_id'] = isContext ? sg.channelCode() + '...CONTEXT' : sg.channelCode();
      channel['sample_rate'] = sg.sampleRate();
      channel['start'] = sg.start();  // moment object (good up to milisecond)
      // microsecond stored separately, tenthMilli from startBTime + microsecond from Blockette 1001
      channel['microsec'] = header.startBTime.tenthMilli * 100 + header.blocketteList[0].body.getInt8(5);
      channel['raw'] = seismogram;
      channel['valid'] = valid;
      const data = [];
      for (let k = 0; k < seismogram.numPoints(); k++) {
        data.push({
          x: channel['microsec'] + (k * 1000000 / channel['sample_rate']),   // trace microsecond offset
          y: seismogram.y()[k],  // trace after mean removal
        });
      }
      channel['data'] = data;
      channel['duration'] = (seismogram.numPoints() - 1) * 1000000 / channel['sample_rate'];  // in microseconds
      let sensor = WaveformUtil.findValue(sensors, 'sensor_code', sg.stationCode());
      if (!sensor) {
        sensor = { sensor_code: sg.stationCode(), channels: [] };
        sensors.push(sensor);
      }
      const invalid = (sensor.channels).findIndex((x) => !x.valid);
      if (invalid >= 0) {
        sensor.channels[invalid] = channel;  // valid channel replaces invalid channel (placeholder)
      } else {
        if (valid || (!valid && sensor.channels.length === 0)) {
          sensor.channels.push(channel);
        }
      }
    });
    if (zTime && zTime.isValid()) {
      timeOrigin = moment(zTime);
      if (changetimeOrigin) {
        zTime.millisecond(0);
        for (const sensor of sensors) {
          for (const channel of sensor.channels) {
            if (!channel.start.isSame(zTime, 'second')) {
              console.log('***adjust time origin for sensor: ' + sensor.sensor_code + ' channel: ' + channel.channel_id);
              const offset = channel.start.diff(zTime, 'seconds') * 1000000;
              channel.microsec += offset;
              for (const datasample of channel.data) { // microsecond offset from new zeroTime
                datasample['x'] += offset;
              }
            }
          }
        }

      }
    }
    eventData['sensors'] = sensors;
    eventData['timeOrigin'] = timeOrigin;
    return (eventData);
  }


  static addCompositeTrace(sensors: Sensor[]): Sensor[] {
    let message = '';
    for (const sensor of sensors) {
      if (sensor.channels.length === 3) {
        if (sensor.channels[0].start.isSame(sensor.channels[1].start) &&
          sensor.channels[0].start.isSame(sensor.channels[2].start) &&
          sensor.channels[0].microsec === sensor.channels[1].microsec &&
          sensor.channels[0].microsec === sensor.channels[2].microsec) {
          if (sensor.channels[0].sample_rate === sensor.channels[1].sample_rate &&
            sensor.channels[0].sample_rate === sensor.channels[2].sample_rate) {
            if (sensor.channels[0].data.length === sensor.channels[1].data.length &&
              sensor.channels[0].data.length === sensor.channels[2].data.length) {
              const compositeTrace = {};
              compositeTrace['code_id'] = sensor.channels[0].code_id.endsWith('...CONTEXT') ?
                sensor.channels[0].code_id.slice(0, -11) + globals.compositeChannelCode + '...CONTEXT' :
                sensor.channels[0].code_id.slice(0, -1) + globals.compositeChannelCode;
              compositeTrace['sensor_code'] = sensor.sensor_code;
              compositeTrace['channel_id'] = globals.compositeChannelCode +
                (sensor.channels[0].channel_id.endsWith('...CONTEXT') ? '...CONTEXT' : '');
              compositeTrace['sample_rate'] = sensor.channels[0].sample_rate;
              compositeTrace['start'] = sensor.channels[0].start;  // moment object (good up to milisecond)
              compositeTrace['microsec'] = sensor.channels[0].microsec;
              compositeTrace['data'] = [];
              compositeTrace['duration'] = sensor.channels[0].duration;  // in microseconds
              for (let k = 0; k < sensor.channels[0].data.length; k++) {
                let compositeValue = 0, sign = 1;
                for (let j = 0; j < 3; j++) {
                  const value = sensor.channels[j].data[k]['y'];
                  sign = sensor.channels[j].channel_id.toLowerCase() === globals.signComponent.toLowerCase() ||
                    sensor.channels[j].channel_id.toLowerCase() === (globals.signComponent + '...CONTEXT').toLowerCase() ?
                    Math.sign(value) : sign;
                  compositeValue += Math.pow(value, 2);
                }
                sign = sign === 0 ? 1 : sign;   // do not allow zero value to zero composite trace value
                compositeValue = Math.sqrt(compositeValue) * sign;
                compositeTrace['data'].push({
                  x: sensor.channels[0].data[k]['x'],
                  y: compositeValue
                });
              }
              sensor.channels.push(compositeTrace);
            } else {
              console.log('Cannot create 3C composite trace for sensor: '
                + sensor['sensor_code'] + ' different channel lengths');
            }
          } else {
            console.log('Cannot create 3C composite trace for sensor: ' +
              sensor['sensor_code'] + ' different sample rates: ' +
              sensor.channels[0].sample_rate + sensor.channels[2].sample_rate + sensor.channels[2].sample_rate);
          }
        } else {
          console.log('Cannot create 3C composite trace for sensor: '
            + sensor['sensor_code'] + ' different channels start times ' +
            sensor.channels[0].start.toISOString() + ' ' + sensor.channels[1].start.toISOString() + ' '
            + sensor.channels[2].start.toISOString());
        }
      } else {
        message += 'Cannot create 3C composite trace for sensor: ' + sensor['sensor_code'] +
          ' available channels: ' + sensor.channels.length + ' (' +
          (sensor.channels.length > 0 ? sensor.channels[0].channel_id +
            (sensor.channels.length > 1 ? sensor.channels[1].channel_id
              : ' ') : ' ') + ')\n';
      }
    }
    if (message) {
      // console.log(message);
      // window.alert(message);
    }
    return sensors;
  }

  static maxValue(dataPoints: { x: number, y: number }[]) {

    let maximum = Math.abs(dataPoints[0].y);
    for (let i = 0; i < dataPoints.length; i++) {
      if (Math.abs(dataPoints[i].y) > maximum) {
        maximum = Math.abs(dataPoints[i].y);
      }
    }
    const ret = Math.ceil(maximum * (WaveformUtil.convYUnits * 10000)) / (WaveformUtil.convYUnits * 10000);
    return ret;
  }

  static addSecondsToUtc(startTimeUtc: string, secondsToAdd: number): string {
    const d = moment(startTimeUtc);
    d.millisecond(0);   // to second precision
    const seconds = parseFloat(startTimeUtc.slice(-8, -1)) + secondsToAdd;
    const end_time = moment(d).add(Math.floor(seconds), 'seconds'); // to the second
    return end_time.toISOString().slice(0, -4) + (seconds % 1).toFixed(6).substring(2) + 'Z';
  }

  // microsec time offset from the origin full second with millisec precision
  static calculateTimeOffset(time: moment.Moment, origin: moment.Moment) {
    let diff = moment(time).millisecond(0).diff(moment(origin).millisecond(0), 'seconds');
    diff *= 1000000;
    diff += moment(time).millisecond() * 1000;
    return diff;
  }

  // microsec time offset from the origin full second with microsec precision
  static calculateTimeOffsetMicro(timeUtc: string, origin: moment.Moment) {
    let diff = moment(timeUtc).millisecond(0).diff(moment(origin).millisecond(0), 'seconds');
    diff *= 1000000;
    diff += parseInt(timeUtc.slice(-7, -1), 10);
    return diff;
  }

  // microsec time offset from the origin full second with microsec precision
  static addTimeOffsetMicro(origin: moment.Moment, micro: number) {

    const fullseconds = Math.floor(micro / 1000000);
    const microsec = micro - fullseconds * 1000000;
    const str = '000000' + microsec;
    const ts = moment(origin).millisecond(0).add(fullseconds, 'seconds');
    return ts.toISOString().slice(0, -4) + str.substring(str.length - 6) + 'Z';
  }

  // tslint:disable-next-line:max-line-length
  static addPredictedPicksDataToSensors(sensors: Sensor[], waveformSensors: WaveformSensor[], timeStart: moment.Moment, timeEnd: moment.Moment, waveformOriginTimeUtc: string): Sensor[] {

    for (const waveSensor of waveformSensors) {

      const sensor = sensors.find(el => el.code === waveSensor.code);

      if (!sensor) {
        console.error(`no sensor on addPredictedPicksData for waveform api sensor`);
        console.error(waveSensor);
        continue;
      }

      if (!waveSensor.preferred_ray.P || !waveSensor.preferred_ray.S) {
        // console.error(`no preferred ray for sensor`);
        // console.error(waveSensor);
        continue;
      }

      sensor.picks = Array.isArray(sensor.picks) ? sensor.picks : [];

      for (const pickKey of Object.values(PredictedPickKey)) {
        let picktime_utc: string;
        const phase = pickKey.toUpperCase();
        const ray = waveSensor.preferred_ray[phase];

        if (pickKey === PredictedPickKey.p || pickKey === PredictedPickKey.s) {
          if (ray) {
            picktime_utc = WaveformUtil.addSecondsToUtc
              (waveformOriginTimeUtc, ray.travel_time);
          }
        } else {
          console.error(`wrong predictedPickKey`);
          continue;
        }
        const pickTime = moment(picktime_utc);

        if ((pickTime.isBefore(timeStart) || pickTime.isAfter(timeEnd))) {
          console.error(`Predicted picks outside the display time window`);
        }

        sensor[pickKey + '_ray_length'] = ray.ray_length;
        sensor[pickKey + '_predicted_time_utc'] = picktime_utc;
        sensor.picks.push({
          value: WaveformUtil.calculateTimeOffsetMicro(picktime_utc, timeStart),  // relative to timeOrigin's full second
          thickness: globals.predictedPicksLineThickness,
          lineDashType: 'dash',
          opacity: 0.5,
          color: pickKey === PredictedPickKey.p ? 'blue' : pickKey === PredictedPickKey.s ? 'red' : 'black',
          label: pickKey,
          labelAlign: 'far',
          labelFormatter: (e) => e.stripLine.opacity === 0 ? '' : e.stripLine.label
        });
      }
    }

    return sensors;
  }


  static addArrivalsPickDataToSensors(sensors: Sensor[], arrivals: Arrival[], origin: moment.Moment): Sensor[] {
    const missingSensors = [];
    for (const arrival of arrivals) {

      if (!arrival.pick) {
        console.error('Picks not found for arrival id: ' + arrival.arrival_resource_id);
        continue;
      }

      if (!arrival.pick.sensor) {
        console.error('Invalid pick sensor for arrival id: ' + arrival.arrival_resource_id);
        continue;
      }

      if (!moment(arrival.pick.time_utc).isValid()) {
        console.error(`Invalid pick time for ${arrival.pick.sensor} (${arrival.pick.phase_hint}): ${arrival.pick.time_utc}`);
        continue;
      }

      // pick.sensor contains the sensor ID (not sensor code)
      const sensor = WaveformUtil.findValue(sensors, 'id', arrival.pick.sensor);

      if (!sensor) {
        if (!missingSensors.includes(arrival.pick.sensor)) {
          missingSensors.push(arrival.pick.sensor);
        }
        continue;
      }

      sensor.picks = (sensor.picks && sensor.picks instanceof Array) ? sensor.picks : [];

      if (arrival.phase === PickKey.P) {
        sensor.P_pick_time_utc = arrival.pick.time_utc;
      } else if (arrival.phase === PickKey.S) {
        sensor.S_pick_time_utc = arrival.pick.time_utc;
      } else {
        continue;
      }

      sensor[arrival.phase + '_pick_time_utc'] = arrival.pick.time_utc;
      sensor.picks.push({
        value: WaveformUtil.calculateTimeOffsetMicro(arrival.pick.time_utc, origin),   // rel timeOrigin full second
        thickness: globals.picksLineThickness,
        color: arrival.phase === PickKey.P ? 'blue' : arrival.phase === PickKey.S ? 'red' : 'black',
        label: arrival.phase,
        labelAlign: 'far',
      });

    }

    if (missingSensors.length > 0) {
      console.error(`No waveforms for picks at sensors: ${missingSensors.toString()}`);
    }
    return sensors;
  }

  /**
   * Returns pick bias.
   *
   * @param sensors - Sensors which picks are are used in calculation
   * @returns average value of (picks - predicted picks) on all input sensors
   *
   */
  static calculatePicksBias(sensors: Sensor[]): number {
    let picksTotalBias = 0;
    let nPicksBias = 0;
    for (const sensor of sensors) {

      for (const pickKey of ['p', 's']) {
        const predicted_key = pickKey + '_predicted_time_utc';
        const pick_key = pickKey + '_pick_time_utc';
        if (sensor.hasOwnProperty(predicted_key) && sensor.hasOwnProperty(pick_key)) {
          const pickTime = moment(sensor[pick_key]);
          const referenceTime = moment(sensor[predicted_key]);
          if (pickTime.isValid() && referenceTime.isValid()) {
            const microsec = sensor[pick_key].slice(-7, -1);
            const microsec_ref = sensor[predicted_key].slice(-7, -1);
            const offset = pickTime.millisecond(0)
              .diff(referenceTime.millisecond(0), 'seconds') * 1000000;
            picksTotalBias += offset + parseInt(microsec, 10) - parseInt(microsec_ref, 10);
            nPicksBias++;
          }
        }
      }
    }
    return Math.round(picksTotalBias / nPicksBias);
  }


  /**
   * Returns sensors populated with pick data.
   *
   * @remarks
   *
   * Function should be used to add to sensorsToPopulate information about picks (arrivals and traveltimes) which should be already stored
   * on sensorsWithAllInfo sensors.
   *
   * Should be used after
   * {@link WaveformUtil.addPredictedPicksDataToSensors()}
   * {@link WaveformUtil.addArrivalsPickDataToSensors()}
   *
   * @param sensorsToPopulate - sensorsToPopulate
   * @param sensorsWithAllInfo - all parameters from this object will replace sensorsToPopulate
   * @param allSensorsMap - map of all sensors to help quickly navigate through data
   *                        format: {sensor_code: <position in sensorsWithAllInfo array>}
   * @returns sensors populated with picks.
   *
   */
  static mapSensorInfoToLoadedSensors(sensorsToPopulate: Sensor[], sensorsWithAllInfo: Sensor[], allSensorsMap: { [key: string]: number }) {
    if (sensorsToPopulate) {
      sensorsToPopulate = sensorsToPopulate.map(sensor => {
        const allSensorInfo = sensorsWithAllInfo[allSensorsMap[sensor.sensor_code]];

        if (allSensorInfo) {
          sensor = { ...sensor, ...allSensorInfo };
        }
        return sensor;
      });
    }
    return sensorsToPopulate;
  }
}



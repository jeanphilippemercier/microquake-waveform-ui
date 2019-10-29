import * as miniseed from 'seisplotjs-miniseed';
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';
import { globals } from '@src/globals';
import { Sensor } from '@interfaces/inventory.interface';
import { Channel, PickType } from '@interfaces/event.interface';
import { PickKey, Arrival, PredictedPickKey, WaveformSensor, PreferredRay } from '@interfaces/event.interface';

export default class WaveformUtil {

  // default time units conversion factor is from s to microsenonds (us)
  static convXUnits = 1000000;

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
    const eventData = {} as any;
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
      const channel: Channel = {};
      channel.code_id = isContext ? sg.codes() + '...CONTEXT' : sg.codes();
      channel.sensor_code = sg.stationCode();
      channel.channel_id = isContext ? sg.channelCode() + '...CONTEXT' : sg.channelCode();
      channel.sample_rate = sg.sampleRate();
      channel.start = sg.start();  // moment object (good up to milisecond)
      // microsecond stored separately, tenthMilli from startBTime + microsecond from Blockette 1001
      channel.microsec = header.startBTime.tenthMilli * 100 + header.blocketteList[0].body.getInt8(5);
      channel.raw = seismogram;
      channel.valid = valid;
      channel.data = [];
      for (let k = 0; k < seismogram.numPoints(); k++) {
        channel.data.push({
          x: channel.microsec + (k * WaveformUtil.convXUnits / channel.sample_rate),   // trace microsecond offset
          y: seismogram.y()[k],  // trace after mean removal
        });
      }
      channel.duration = (seismogram.numPoints() - 1) * WaveformUtil.convXUnits / seismogram.sampleRate();  // in microseconds
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
              const offset = channel.start.diff(zTime, 'seconds') * WaveformUtil.convXUnits;
              channel.microsec += offset;
              for (const datasample of channel.data) { // microsecond offset from new zeroTime
                datasample['x'] += offset;
              }
            }
          }
        }

      }
    }
    eventData.sensors = sensors;
    eventData.timeOrigin = timeOrigin;
    return (eventData);
  }

  static setSensorsEnabled(eventSensors: Sensor[], sensors: Sensor[]) {

    for (const eventSensor of eventSensors) {

      const sensor = sensors.find(el => el.code === eventSensor.sensor_code);

      if (!sensor) {
        console.error(`no sensor on cleanSensors for event sensor`);
        console.error(eventSensor);
        continue;
      }

      eventSensor.enabled = sensor.enabled;

      for (const eventChannel of eventSensor.channels) {
        const channel = sensor.components.find(
            el => el.code.toUpperCase() === eventChannel.channel_id.replace('...CONTEXT', '').toUpperCase());
        eventChannel.enabled = channel ? channel.enabled : true;
      }
    }
  }

  static rotateComponents(seisX, seisY, seisZ, sensor: Sensor, backazimuth, incidence): any {

    if (seisX.y().length !== seisY.y().length ||
      seisX.y().length !== seisZ.y().length ||
      seisY.y().length !== seisY.y().length) {
      console.error('seismograms do not have same length: ');
      console.error(sensor);
      return null;
    }

    if (seisX.sampleRate() !== seisY.sampleRate() ||
      seisX.sampleRate() !== seisZ.sampleRate() ||
      seisY.sampleRate() !== seisY.sampleRate()) {
      console.error('seismograms do not have same sample rate: ');
      console.error(sensor);
      return null;
    }

    if (!seisX.start().isSame(seisY.start()) ||
      !seisX.start().isSame(seisZ.start()) ||
      !seisY.start().isSame(seisZ.start())) {
      console.error('seismograms do not have same start time: ');
      console.error(sensor);
      return null;
    }

    const x = new Array(seisX.y().length);
    const y = new Array(seisX.y().length);
    const z = new Array(seisX.y().length);
    const compX = sensor.components.find(el => el.code.toUpperCase() === 'X');
    const compY = sensor.components.find(el => el.code.toUpperCase() === 'Y');
    const compZ = sensor.components.find(el => el.code.toUpperCase() === 'Z');
    for (let i = 0; i < seisX.y().length; i++) {
      const eVal = seisX.yAtIndex(i) * compX.orientation_x +
        seisY.yAtIndex(i) * compY.orientation_x +
        seisZ.yAtIndex(i) * compZ.orientation_x;
      const nVal = seisX.yAtIndex(i) * compX.orientation_y +
        seisY.yAtIndex(i) * compY.orientation_y +
        seisZ.yAtIndex(i) * compZ.orientation_y;
      const vVal = seisX.yAtIndex(i) * compX.orientation_z +
        seisY.yAtIndex(i) * compY.orientation_z +
        seisZ.yAtIndex(i) * compZ.orientation_z;
      if (backazimuth !== null && incidence !== null) { // XYZ => P SV SH
        x[i] = vVal * Math.cos(incidence)
          - eVal * Math.sin(incidence) * Math.sin(backazimuth)
          - nVal * Math.sin(incidence) * Math.cos(backazimuth);
        y[i] = vVal * Math.sin(incidence)
          + eVal * Math.cos(incidence) * Math.sin(backazimuth)
          + nVal * Math.cos(incidence) * Math.cos(backazimuth);
        z[i] = - eVal * Math.cos(backazimuth)
          + nVal * Math.sin(backazimuth);
      } else { // XYZ => ENV
        x[i] = eVal;
        y[i] = nVal;
        z[i] = vVal;
      }
    }
    let newCompX = 'E';
    let newCompY = 'N';
    let newCompZ = 'V';
    if (backazimuth !== null && incidence !== null) {
      newCompX = 'P';
      newCompY = 'SV';
      newCompZ = 'SH';
    }
    const rotX = seisX.clone().y(x).chanCode(seisX.chanCode().slice(0, -1) + newCompX);
    const rotY = seisY.clone().y(y).chanCode(seisY.chanCode().slice(0, -1) + newCompY);
    const rotZ = seisZ.clone().y(z).chanCode(seisZ.chanCode().slice(0, -1) + newCompZ);
    const outRotX = filter.rMean(rotX);
    const outRotY = filter.rMean(rotY);
    const outRotZ = filter.rMean(rotZ);
    return {
      'x': outRotX,
      'y': outRotY,
      'z': outRotZ,
    };

  }

  static rotateSensors(xyzSensors: Sensor[], sensors: Sensor[], waveformSensors: WaveformSensor[]) {

    for (const xyzSensor of xyzSensors) {

      const sensor = sensors.find(el => el.code === xyzSensor.sensor_code);

      if (!sensor) {
        console.error(`no sensor on rotateSensors for xyz sensor`);
        console.error(xyzSensor);
        continue;
      }

      let backazimuth = null, incidence = null; // angles in radians
      const waveformSensor = waveformSensors.find(el => el.code === xyzSensor.sensor_code);

      if (!waveformSensor) {
        console.error(`no waveform sensor on rotatedComponents for xyz sensor`);
        console.error(xyzSensor);
        continue;
      }

      const ray = waveformSensor.preferred_ray.P !== null ? waveformSensor.preferred_ray.P :
        waveformSensor.preferred_ray.S !== null ? waveformSensor.preferred_ray.S : null;
      if (ray !== null && ray.back_azimuth !== null && ray.incidence_angle !== null) {
        if (Object.values(PickKey).includes(ray.phase)) {
          backazimuth = ray.back_azimuth;
          incidence = ray.incidence_angle;
        }
      }

      if (sensor.hasOwnProperty('orientation_valid') && sensor.orientation_valid) {
        if (xyzSensor.channels.length === 3) {
          const channelX = xyzSensor.channels.find(
            el => el.channel_id.replace('...CONTEXT', '').toUpperCase() === 'X');
          const channelY = xyzSensor.channels.find(
            el => el.channel_id.replace('...CONTEXT', '').toUpperCase() === 'Y');
          const channelZ = xyzSensor.channels.find(
            el => el.channel_id.replace('...CONTEXT', '').toUpperCase() === 'Z');
          if (channelX && channelY && channelZ &&
            channelX.hasOwnProperty('raw') && channelY.hasOwnProperty('raw') && channelZ.hasOwnProperty('raw') &&
            channelX.enabled && channelY.enabled && channelZ.enabled) {
            const result = this.rotateComponents(channelX.raw, channelY.raw, channelZ.raw, sensor, backazimuth, incidence);
            if (result) {
              channelX.rotated = result.x;
              channelY.rotated = result.y;
              channelZ.rotated = result.z;
            }
          }
        } else {
          console.log(`cannot rotate sensor no XYZ components available or components not enabled`);
          console.log(xyzSensor);
        }
      }
    }
  }

  static addCompositeTrace(sensors: Sensor[]): Sensor[] {
    const toLower = function (x) {
      return x.toLowerCase();
    };
    for (const sensor of sensors) {

      if (sensor.hasOwnProperty('enabled') && !sensor.enabled) {
        console.log(`cannot create 3C composite trace for sensor not enabled`);
        console.log(sensor);
        continue;
      }

      if (sensor.channels.length < 3) {
        console.log(`cannot create 3C composite trace for sensor with less than 3 channels`);
        console.log(sensor);
        continue;
      }

      const comp1 = sensor.channels[0];
      const comp2 = sensor.channels[1];
      const comp3 = sensor.channels[2];

      if (comp1.hasOwnProperty('enabled') && !comp1.enabled ||
          comp2.hasOwnProperty('enabled') && !comp2.enabled ||
          comp3.hasOwnProperty('enabled') && !comp3.enabled) {
        console.log(`cannot create 3C composite trace for sensor with components disabled`);
        console.log(sensor);
        continue;
      }

      if (!comp1.start.isSame(comp2.start) || !comp1.start.isSame(comp3.start) ||
          comp1.microsec !== comp2.microsec || comp1.microsec !== comp3.microsec) {
        console.log(`cannot create 3C composite trace for sensor with different channels start times`);
        console.log(sensor);
        continue;
      }

      if (comp1.sample_rate !== comp2.sample_rate || comp1.sample_rate !== comp3.sample_rate) {
        console.log(`cannot create 3C composite trace for sensor with different sample rates`);
        console.log(sensor);
        continue;
      }

      if (comp1.data.length !== comp2.data.length || comp1.data.length !== comp3.data.length) {
        console.log(`cannot create 3C composite trace for sensor with different lengths`);
        console.log(sensor);
        continue;
      }

      const compositeTrace: Channel = {};
      compositeTrace.code_id = sensor.channels[0].code_id.endsWith('...CONTEXT') ?
        sensor.channels[0].code_id.slice(0, -11) + globals.compositeChannelCode + '...CONTEXT' :
        sensor.channels[0].code_id.slice(0, -1) + globals.compositeChannelCode;
      compositeTrace.sensor_code = sensor.channels[0].sensor_code;
      compositeTrace.channel_id = globals.compositeChannelCode +
        (sensor.channels[0].channel_id.endsWith('...CONTEXT') ? '...CONTEXT' : '');
      compositeTrace.sample_rate = sensor.channels[0].sample_rate;
      compositeTrace.start = sensor.channels[0].start;  // moment object (good up to milisecond)
      compositeTrace.microsec = sensor.channels[0].microsec;
      compositeTrace.data = [];
      compositeTrace.duration = sensor.channels[0].duration;  // in microseconds
      compositeTrace.enabled = true;
      for (let k = 0; k < sensor.channels[0].data.length; k++) {
        let compositeValue = 0, sign = 1;
        for (let j = 0; j < 3; j++) {
          const value = sensor.channels[j].data[k].y;
          const comp = sensor.channels[j].channel_id.replace('...CONTEXT', '');
          sign = globals.signComponents.map(toLower).includes(comp.toLowerCase()) ? Math.sign(value) : sign;
          compositeValue += Math.pow(value, 2);
        }
        sign = sign === 0 ? 1 : sign;   // do not allow zero value to zero composite trace value
        compositeValue = Math.sqrt(compositeValue) * sign;
        compositeTrace.data.push({
          x: sensor.channels[0].data[k].x,
          y: compositeValue
        });
      }
      sensor.channels.push(compositeTrace);
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
    diff *= WaveformUtil.convXUnits;
    diff += moment(time).millisecond() * 1000;
    return diff;
  }

  // microsec time offset from the origin full second with microsec precision
  static calculateTimeOffsetMicro(timeUtc: string, origin: moment.Moment) {
    let diff = moment(timeUtc).millisecond(0).diff(moment(origin).millisecond(0), 'seconds');
    diff *= WaveformUtil.convXUnits;
    diff += parseInt(timeUtc.slice(-7, -1), 10);
    return diff;
  }

  // microsec time offset from the origin full second with microsec precision
  static addTimeOffsetMicro(origin: moment.Moment, micro: number) {

    const fullseconds = Math.floor(micro / WaveformUtil.convXUnits);
    const microsec = micro - fullseconds * WaveformUtil.convXUnits;
    const str = '000000' + microsec;
    const ts = moment(origin).millisecond(0).add(fullseconds, 'seconds');
    return ts.toISOString().slice(0, -4) + str.substring(str.length - 6) + 'Z';
  }

  // tslint:disable-next-line:max-line-length
  static addPredictedPicksDataToSensors(sensors: Sensor[], waveformSensors: WaveformSensor[], timeStart: moment.Moment, timeEnd: moment.Moment, waveformOriginTimeUtc: string): Sensor[] {

    for (const waveformSensor of waveformSensors) {

      const sensor = sensors.find(el => el.code === waveformSensor.code);

      if (!sensor) {
        console.error(`no sensor on addPredictedPicksData for waveform sensor`);
        console.error(waveformSensor);
        continue;
      }

      if (waveformSensor.preferred_ray.P == null && waveformSensor.preferred_ray.S == null) {
        // console.error(`no preferred ray for sensor on addPredictedPicksData`);
        // console.error(waveformSensor);
        continue;
      }

      sensor.picks = Array.isArray(sensor.picks) ? sensor.picks : [];

      for (const pickKey of Object.values(PredictedPickKey)) {
        let picktime_utc: string;
        const phase = pickKey.toUpperCase();
        const ray = waveformSensor.preferred_ray[phase];

        if (ray !== null && ray.phase === phase) {
          picktime_utc = WaveformUtil.addSecondsToUtc
            (waveformOriginTimeUtc, ray.travel_time);

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
            labelFormatter: (e) => e.stripLine.opacity === 0 ? '' : e.stripLine.label,
            pickType: PickType.TRAVELTIME
          });
        }
      }
    }

    return sensors;
  }

  static removeArrivalsPickDataFromSensors(sensors: Sensor[]) {
    if (!sensors || sensors.length === 0) {
      return [];
    }

    sensors.forEach(val => {
      if (val.picks) {
        val.picks = val.picks.filter(pick => pick.pickType !== PickType.ARRIVAL);
      }
    });

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

      // pick.sensor contains the sensor id (not sensor code)
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
        pickType: PickType.ARRIVAL
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
    let picksBias = 0;
    let nPicksBias = 0;
    for (const sensor of sensors) {

      for (const pickKey of Object.values(PredictedPickKey)) {
        const predicted_key = pickKey + '_predicted_time_utc';
        const pick_key = pickKey.toUpperCase() + '_pick_time_utc';
        if (sensor.hasOwnProperty(predicted_key) && sensor.hasOwnProperty(pick_key)) {
          const pickTime = moment(sensor[pick_key]);
          const referenceTime = moment(sensor[predicted_key]);
          if (pickTime.isValid() && referenceTime.isValid()) {
            const microsec = sensor[pick_key].slice(-7, -1);
            const microsec_ref = sensor[predicted_key].slice(-7, -1);
            const offset = pickTime.millisecond(0)
              .diff(referenceTime.millisecond(0), 'seconds') * WaveformUtil.convXUnits;
            picksBias += offset + parseInt(microsec, 10) - parseInt(microsec_ref, 10);
            nPicksBias++;
          }
        }
      }
    }
    picksBias = nPicksBias > 0 ? Math.round(picksBias / nPicksBias) : 0;
    return picksBias;
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



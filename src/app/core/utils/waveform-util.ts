import * as miniseed from 'seisplotjs-miniseed';
import * as filter from 'seisplotjs-filter';
import * as moment from 'moment';
import { globals } from '@src/globals';
import { Sensor } from '@interfaces/event.interface';

export default class WaveformUtil {

  static findValue(obj, key, value) {
    return obj.find(v => v[key] === value);
  }

  static findNestedValue(obj, key, subkey, value, otherkey, othervalue) {
    return obj.find(v => (v[key][subkey].toString() === value.toString() && v[otherkey] === othervalue));
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
      if (!zTime) {
        zTime = moment(sg.start());  // starting time (use it up to tenth of second)
        zTime.millisecond(Math.floor(zTime.millisecond() / 100) * 100);
      } else {
        if (!sg.start().isSame(zTime, 'second')) {
          zTime = moment(moment.min(zTime, sg.start()));
          changetimeOrigin = true;
        }
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
        console.log('***changetimeOrigin channels change in earliest time second detected');
        zTime.millisecond(0);
        for (const sensor of sensors) {
          for (const channel of sensor.channels) {
            if (!channel.start.isSame(zTime, 'second')) {
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
              compositeTrace['code_id'] = sensor.channels[0].code_id.slice(0, -1) + globals.compositeChannelCode;
              compositeTrace['sensor_code'] = sensor.sensor_code;
              compositeTrace['channel_id'] = globals.compositeChannelCode;
              compositeTrace['sample_rate'] = sensor.channels[0].sample_rate;
              compositeTrace['start'] = sensor.channels[0].start;  // moment object (good up to milisecond)
              compositeTrace['microsec'] = sensor.channels[0].microsec;
              compositeTrace['data'] = [];
              compositeTrace['duration'] = sensor.channels[0].duration;  // in microseconds
              for (let k = 0; k < sensor.channels[0].data.length; k++) {
                let compositeValue = 0, sign = 1;
                for (let j = 0; j < 3; j++) {
                  const value = sensor.channels[j].data[k]['y'];
                  sign = sensor.channels[j].channel_id.toLowerCase() === globals.signComponent.toLowerCase() ?
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
            sensor.channels[0].start.toISOString() + sensor.channels[1].start.toISOString()
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
      console.log(message);
      // window.alert(message);
    }
    return sensors;
  }

}



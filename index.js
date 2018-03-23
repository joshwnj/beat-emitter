// with credits to https://github.com/cwilso/metronome

const EventEmitter = require('events')

function worker () {
  let timerId

  self.onmessage = function (e) {
	  if (e.data === 'start') {
      timerId = setInterval(postMessage.bind(null, 'tick'), 25)
	  } else if (e.data === 'stop') {
		  clearInterval(timerId)
		  timerId = null
	  }
  }
}

function funcToString (func) {
  return func.toString().replace(/^[\w\W]*?\{([\w\W]*)\}[\w\W]*$/, '$1')
}

module.exports = function (ac) {
  const emitter = new EventEmitter()

  // how far ahead to schedule
  const scheduleAheadTime = 0.1
  let currentBeat = 0
  let nextBeatTime = 0.0
  let bpm = 60
  let secondsPerBeat = 60.0 / bpm

  const w = new Worker(URL.createObjectURL(new Blob(
    [ funcToString(worker) ], 
    { type: 'application/javascript' }
  )))

  w.onmessage = function (e) {
    if (e.data === 'tick') { onTick() }
  }

  function beat (time) {
    emitter.emit('schedule', currentBeat, time || ac.currentTime)
    currentBeat ++
    return time + secondsPerBeat
  }

  return {
    setBpm: function (value) {
      bpm = value
      secondsPerBeat = 60.0 / bpm
    },

    info: function () {
      return {
        bpm,
        secondsPerBeat
      }
    },

    start: function () {
      currentNote = 0
      nextNoteTime = ac.currentTime
      w.postMessage('start')
    },

    stop: function () {
      w.postMessage('stop')
    },

    beat,
    emitter,
    schedule: (func) => {
      emitter.on('schedule', func)
      return func
    },
    clearSchedule: emitter.removeListener.bind(emitter, 'schedule')
  }

  // ----

  function onTick () {
    while (nextBeatTime < ac.currentTime + scheduleAheadTime) {
      nextBeatTime = beat(nextBeatTime)
    }
  }
}

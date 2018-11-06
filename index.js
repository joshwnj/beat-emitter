// with credits to https://github.com/cwilso/metronome

const EventEmitter = require('events')

function worker () {
  let timerId

  function stop () {
    clearInterval(timerId)
    timerId = null
  }

  self.onmessage = function (e) {
    switch (e.data) {
    case 'start':
      stop()
      timerId = setInterval(postMessage.bind(null, 'tick'), 25)
      break

    case 'stop':
      stop() 
      break
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
  let schedules = []
  let loopFrom
  let loopTo
  let shuffleSlice

  const w = new Worker(URL.createObjectURL(new Blob(
    [ funcToString(worker) ],
    { type: 'application/javascript' }
  )))

  w.onmessage = function (e) {
    if (e.data === 'tick') { onTick() }
  }

  function applyLoop (beat, from, to) {
    if (!to || beat < to) { return beat }

    const span = to - from
    return applyLoop(beat - span, from, to)
  }

  function beat (time) {
    emitter.emit('schedule', currentBeat, time || ac.currentTime)

    currentBeat = applyLoop(currentBeat + 1, loopFrom, loopTo)

    return time + secondsPerBeat
  }

  return {
    setBpm: function (value) {
      bpm = value
      secondsPerBeat = 60.0 / bpm
    },

    setShuffle: function (value) {
      if (!value) {
        shuffleSlice = null
      }
      else {
        shuffleSlice = [
          secondsPerBeat * (1 - value),
          secondsPerBeat * (1 + value),
        ]
      }
    },

    info: function () {
      return {
        bpm,
        secondsPerBeat,
        loopFrom,
        loopTo
      }
    },

    start: function (beat = 0) {
      currentBeat = beat
      nextBeatTime = ac.currentTime
      w.postMessage('start')
    },

    loop: function ({ from, to }) {
      loopFrom = from
      loopTo = to
    },

    stop: function () {
      w.postMessage('stop')
    },

    reset: function () {
      neatBeatTime = ac.currentTime
      currentBeat = 0
    },

    beat,
    emitter,
    schedule: (func) => {
      const wrappedFunc = (beat, time) => {
        const shuffle = shuffleSlice ? shuffleSlice[beat % 2] : 0

        try {
          func(beat, time + shuffle)
        } catch (e) {
          console.error(e)
        }
      }
      emitter.on('schedule', wrappedFunc)
      schedules.push(wrappedFunc)
      return wrappedFunc
    },
    clearSchedule: emitter.removeListener.bind(emitter, 'schedule'),
    clearAllSchedules: () => {
      schedules.forEach(s => emitter.removeListener('schedule', s))
      schedules = []
    }
  }

  // ----

  function onTick () {
    while (nextBeatTime < ac.currentTime + scheduleAheadTime) {
      nextBeatTime = beat(nextBeatTime)
    }
  }
}

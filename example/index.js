const beatEmitter = require('beat-emitter')

const ac = new AudioContext()
const beats = beatEmitter(ac)

beats.setBpm(110)
beats.start()
beats.schedule((beat, time) => {
  // play a note every 2nd beat
  if (beat % 2 === 0) {
    const osc = ac.createOscillator()
    osc.frequency.value = 440
    osc.start(time)
    osc.stop(time + 0.1)
    osc.connect(ac.destination)
  }
})

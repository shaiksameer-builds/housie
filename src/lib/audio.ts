// Web Audio API Synthesizer and Web Speech Synthesis for Housie Night

// Traditional Indian Tambola / Housie Calling Nicknames
export const TAMBOLA_NICKNAMES: Record<number, string> = {
  1: 'Top of the house, Number 1',
  2: 'Kaala dana, Number 2',
  3: 'Goodness me, Number 3',
  4: 'Knock at the door, Number 4',
  5: 'Fingers in a hand, Number 5',
  6: 'In a fix, Number 6',
  7: 'Lucky number seven, Number 7',
  8: 'One fat lady, Number 8',
  9: 'Doctor’s time, Number 9',
  10: 'A big fat hen, Number 10',
  11: 'Two beautiful legs, Number 11',
  12: 'One dozen, Number 12',
  13: 'Lucky for me, Number 13',
  14: 'Valentine’s day, Number 14',
  15: 'Yet to be kissed, Number 15',
  16: 'Sweet sixteen, Number 16',
  17: 'Dancing queen, Number 17',
  18: 'Now you can vote, Number 18',
  19: 'Goodbye teens, Number 19',
  20: 'One score, Number 20',
  21: 'Royal salute, Number 21',
  22: 'Two little ducks, 22',
  23: 'You and me, Number 23',
  24: 'Two dozen, Number 24',
  25: 'Silver jubilee, Number 25',
  26: 'Republic Day, Number 26',
  27: 'Gateway to heaven, Number 27',
  28: 'Duck and its mate, Number 28',
  29: 'In your prime, Number 29',
  30: 'Flirty thirty, Number 30',
  31: 'Flavours of ice cream, 31',
  32: 'Buckle my shoe, Number 32',
  33: 'All the threes, 33',
  34: 'Ask for more, Number 34',
  35: 'Jump and jive, Number 35',
  36: 'Popular size, Number 36',
  37: 'Mixed luck, Number 37',
  38: 'Christmas cake, Number 38',
  39: 'Watch your waistline, 39',
  40: 'Naughty forty, Number 40',
  41: 'Life begins, Number 41',
  42: 'Quit work, Number 42',
  43: 'Down on your knees, 43',
  44: 'All the fours, 44',
  45: 'Halfway there, Number 45',
  46: 'Up to tricks, Number 46',
  47: 'Year of Independence, 47',
  48: 'Four dozen, Number 48',
  49: 'Rise and shine, Number 49',
  50: 'Golden jubilee, Number 50',
  51: 'Turbanator, Number 51',
  52: 'Pack of cards, Number 52',
  53: 'Pack with a joker, 53',
  54: 'Clean the floor, Number 54',
  55: 'All the fives, 55',
  56: 'Pick up sticks, Number 56',
  57: 'Mutiny Year, Number 57',
  58: 'Time to retire, Number 58',
  59: 'Just retired, Number 59',
  60: 'Five dozen, Number 60',
  61: 'Baker’s bun, Number 61',
  62: 'Click the photo, Number 62',
  63: 'Tickle me, Number 63',
  64: 'Almost retired, Number 64',
  65: 'Old age pension, Number 65',
  66: 'Clickety click, 66',
  67: 'Made in heaven, Number 67',
  68: 'Saving grace, Number 68',
  69: 'Ulta pulta, Number 69',
  70: 'Lucky blind, Number 70',
  71: 'Bang on the drum, 71',
  72: 'Six dozen, Number 72',
  73: 'Under the tree, Number 73',
  74: 'Candy store, Number 74',
  75: 'Diamond jubilee, Number 75',
  76: 'Run out of tricks, 76',
  77: 'Two hockey sticks, 77',
  78: 'Heaven’s gate, Number 78',
  79: 'One more time, Number 79',
  80: 'Blind eighty, Number 80',
  81: 'Corner shot, Number 81',
  82: 'Fat lady with duck, 82',
  83: 'Time for tea, Number 83',
  84: 'Seven dozen, Number 84',
  85: 'Staying alive, Number 85',
  86: 'Between the sticks, 86',
  87: 'Nearing the end, Number 87',
  88: 'Two fat ladies, 88',
  89: 'Nearly there, Number 89',
  90: 'Top of the shop, Blind 90!',
};

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSound = localStorage.getItem('housie_sound');
      const savedVoice = localStorage.getItem('housie_voice');
      this.soundEnabled = savedSound !== 'false';
      this.voiceEnabled = savedVoice !== 'false';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('housie_sound', enabled ? 'true' : 'false');
    }
  }

  setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('housie_voice', enabled ? 'true' : 'false');
    }
  }

  // Play a pleasant chime tone when a new number is called
  playCallChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Audio error ignored
    }
  }

  // Play a satisfying tactile dab click
  playMarkDab() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // Play a victorious fanfare arpeggio on win!
  playWinFanfare() {
    if (!this.soundEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch (e) {}
  }

  // Speak the called number with traditional Indian Tambola nickname
  speakNumber(num: number) {
    if (!this.voiceEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const text = TAMBOLA_NICKNAMES[num] || `Number ${num}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();

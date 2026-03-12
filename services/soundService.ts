class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext() {
    if (!this.ctx) {
      // Create context only on user interaction if needed, or lazy load
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // High tech "blip"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {
      console.error(e);
    }
  }

  playSuccess() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      // Futuristic ascending chime
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Arpeggio
      const now = ctx.currentTime;
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + (i * 0.06);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.05, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) { console.error(e); }
  }
  
  playError() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      // Dissonant Alert Sound (Dual tone buzzer)
      const t = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = 'square';
      osc2.type = 'square';
      
      // Two close frequencies to create a harsh beating effect
      osc1.frequency.setValueAtTime(150, t);
      osc2.frequency.setValueAtTime(165, t); 
      
      // Rapid decay
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.3);
      osc2.stop(t + 0.3);
    } catch (e) { console.error(e); }
  }

  playHover() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      // Very subtle airy tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.005, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch (e) {}
  }
}

export const soundService = new SoundService();
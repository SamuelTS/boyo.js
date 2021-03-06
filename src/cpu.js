var X = X || {};

X.CPU = (function() {

  'use strict';

  var DIV_accumulator = 0;
  var TIMA_accumulator = 0;
  var timer_clocks = [1024, 16, 64, 256]; //[4096, 262144, 65536, 16384];

  return {

    /**
      * Registers
      */

    PC: 0,
    SP: 0,

    A: 0, F: 0, get AF() { return X.Utils.hilo(this.A, this.F); }, set AF(x) { this.A = X.Utils.hi(x); this.F = X.Utils.lo(x) & 0xF0; },
    B: 0, C: 0, get BC() { return X.Utils.hilo(this.B, this.C); }, set BC(x) { this.B = X.Utils.hi(x); this.C = X.Utils.lo(x); },
    D: 0, E: 0, get DE() { return X.Utils.hilo(this.D, this.E); }, set DE(x) { this.D = X.Utils.hi(x); this.E = X.Utils.lo(x); },
    H: 0, L: 0, get HL() { return X.Utils.hilo(this.H, this.L); }, set HL(x) { this.H = X.Utils.hi(x); this.L = X.Utils.lo(x); },

    get_flag: function(mask) { return !!(this.F & mask); },
    set_flag: function(mask, set) { set ? this.F |= mask : this.F &= ~mask; },

    get carry() { return this.get_flag(1 << 4); }, set carry(x) { this.set_flag(1 << 4, x); },
    get halfcarry() { return this.get_flag(1 << 5); }, set halfcarry(x) { this.set_flag(1 << 5, x); },
    get addsub() { return this.get_flag(1 << 6); }, set addsub(x) { this.set_flag(1 << 6, x); },
    get zero() { return this.get_flag(1 << 7); }, set zero(x) { this.set_flag(1 << 7, x); },

    /**
      * Timer and divider
      */

    DIV: 0,
    TIMA: 0,
    TMA: 0,
    timer_enable: 0,
    timer_clock: 0,

    read: function(address) {
      switch (address) {
      case 0xFF04:
        return this.DIV;

      case 0xFF05:
        return this.TIMA;

      case 0xFF06:
        return this.TMA;

      case 0xFF07:
        return this.timer_enable << 2
          | this.timer_clock;

      case 0xFF0F:
        return this.interrupt_request;

      case 0xFFFF:
        return this.interrupt_enable;

      default:
        throw new Error("read: unmapped address " + X.Utils.hex16(address));
        return 0;
      }
    },

    write: function(address, value) {
      switch (address) {
      case 0xFF04:
        this.DIV = 0;
        break;

      case 0xFF06:
        this.TMA = value;
        break;

      case 0xFF07:
        this.timer_enable = (value >> 2) & 1;
        this.timer_clock = value & 3;
        break;

      case 0xFFFF:
        this.interrupt_enable = value;
        break;
      }
    },

    update_timers: function(cycles) {

      DIV_accumulator += cycles;
      if (DIV_accumulator > 0xFF) {
        this.DIV = this.DIV + 1 & 0xFF;
        DIV_accumulator -= 0xFF;
      }

      if (this.timer_enable) {
        TIMA_accumulator += cycles;
        if (TIMA_accumulator >= timer_clocks[this.timer_clock]) {
          var tima = this.TIMA + 1;
          TIMA_accumulator -= timer_clocks[this.timer_clock];
          if (tima > 0xFF) {
            this.request_interrupt(2);
            this.TIMA = this.TMA;
          }
          else {
            this.TIMA = tima;
          }
        }
      }
    },

    /**
      * Interrupts
      */

    halted: false,
    stopped: false,

    interrupt_master_enable: true,
    // get interrupt_enable() { return X.Memory.r(0xFFFF); },
    // get interrupt_request() { return X.Memory.r(0xFF0F); }, set interrupt_request(x) { X.Memory.w(0xFF0F, x); },

    request_interrupt: function(bit) {
      this.interrupt_request |= 1 << bit;
    },

    check_interrupts: function() {

      var interrupts = this.interrupt_request & this.interrupt_enable;
      if (interrupts == 0)
        return;

      // Interrupts terminate HALT
      this.halted = false;

      // Execute interrupts if enabled
      if (this.interrupt_master_enable)
        for (var b = 0; b < 5; ++b)
          if (X.Utils.bit(interrupts, b)) {
            this.do_interrupt(b);
            return;
          }
    },

    do_interrupt: function(bit) {

      // Disable interrupts
      this.interrupt_master_enable = false;
      this.interrupt_request &= ~(1 << bit);

      // Jump to the address of the interrupt procedure
      this.call(0x40 + 8*bit);
    },

    /**
      * Instructions
      */

    instructions: [],

    /**
      * Methods
      */

    push: function(value) {
      this.SP = this.SP - 1 & 0xFFFF;
      X.Memory.w(this.SP, value);
    },

    pop: function() {
      var value = X.Memory.r(this.SP);
      this.SP = this.SP + 1 & 0xFFFF;
      return value;
    },

    jump: function(address) {
      this.PC = address;
    },

    call: function(address) {
      this.push(X.Utils.hi(X.CPU.PC));
      this.push(X.Utils.lo(X.CPU.PC));
      this.jump(address);
    },

    ret: function() {
      var lo = X.CPU.pop();
      var hi = X.CPU.pop();
      this.jump(X.Utils.hilo(hi, lo));
    },

    init: function() {

      // Generate the instruction set
      this.instructions = X.InstructionSet.generate();
      console.log(this.instructions.length + ' instructions generated.');
    },

    reset: function() {

      this.PC = 0x100;
      this.SP = 0xFFFE;
      this.A = 0;
      this.F = 0;
      this.B = 0;
      this.C = 0;
      this.D = 0;
      this.E = 0;
      this.H = 0;
      this.L = 0;

      this.halted = false;
      this.stopped = false;
    },

    step: function() {

      var cycles = 1; // TODO check cycles on HALT/STOP
      // TODO handle timer & PPU without CPU

      if (!this.halted && !this.stopped) {

        // Fetch

        var opcode = X.Memory.r(this.PC);

        var cb_prefix = opcode == 0xCB;
        if (cb_prefix)
          opcode = 0x100 + X.Memory.r(this.PC + 1);

        var instruction = this.instructions[opcode];
        if (instruction === undefined || instruction === null) console.log(opcode, this.PC);
        var bytes = instruction.bytes;
        var operands = X.Memory.r_(this.PC + (cb_prefix ? 2 : 1), bytes - (cb_prefix ? 2 : 1));

        // Execute

        //X.Debugger.log_instruction(opcode);
        cycles = instruction.execute(operands);
      }

      // Update timers
      this.update_timers(cycles); // TODO should not update on STOP??

      // Check for interrupts
      this.check_interrupts(); // TODO Should executing an interrupt consume cycles?

      return cycles;
    },

  };

})();

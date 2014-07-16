(function(globals) {

  'use strict';

  var bios = [0x31, 0xfe, 0xff, 0xaf, 0x21, 0xff, 0x9f, 0x32, 0xcb, 0x7c, 0x20, 0xfb, 0x21, 0x26, 0xff, 0xe, 0x11, 0x3e, 0x80, 0x32, 0xe2, 0xc, 0x3e, 0xf3, 0xe2, 0x32, 0x3e, 0x77, 0x77, 0x3e, 0xfc, 0xe0, 0x47, 0x11, 0x4, 0x1, 0x21, 0x10, 0x80, 0x1a, 0xcd, 0x95, 0x0, 0xcd, 0x96, 0x0, 0x13, 0x7b, 0xfe, 0x34, 0x20, 0xf3, 0x11, 0xd8, 0x0, 0x6, 0x8, 0x1a, 0x13, 0x22, 0x23, 0x5, 0x20, 0xf9, 0x3e, 0x19, 0xea, 0x10, 0x99, 0x21, 0x2f, 0x99, 0xe, 0xc, 0x3d, 0x28, 0x8, 0x32, 0xd, 0x20, 0xf9, 0x2e, 0xf, 0x18, 0xf3, 0x67, 0x3e, 0x64, 0x57, 0xe0, 0x42, 0x3e, 0x91, 0xe0, 0x40, 0x4, 0x1e, 0x2, 0xe, 0xc, 0xf0, 0x44, 0xfe, 0x90, 0x20, 0xfa, 0xd, 0x20, 0xf7, 0x1d, 0x20, 0xf2, 0xe, 0x13, 0x24, 0x7c, 0x1e, 0x83, 0xfe, 0x62, 0x28, 0x6, 0x1e, 0xc1, 0xfe, 0x64, 0x20, 0x6, 0x7b, 0xe2, 0xc, 0x3e, 0x87, 0xe2, 0xf0, 0x42, 0x90, 0xe0, 0x42, 0x15, 0x20, 0xd2, 0x5, 0x20, 0x4f, 0x16, 0x20, 0x18, 0xcb, 0x4f, 0x6, 0x4, 0xc5, 0xcb, 0x11, 0x17, 0xc1, 0xcb, 0x11, 0x17, 0x5, 0x20, 0xf5, 0x22, 0x23, 0x22, 0x23, 0xc9, 0xce, 0xed, 0x66, 0x66, 0xcc, 0xd, 0x0, 0xb, 0x3, 0x73, 0x0, 0x83, 0x0, 0xc, 0x0, 0xd, 0x0, 0x8, 0x11, 0x1f, 0x88, 0x89, 0x0, 0xe, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99, 0xbb, 0xbb, 0x67, 0x63, 0x6e, 0xe, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e, 0x3c, 0x42, 0xb9, 0xa5, 0xb9, 0xa5, 0x42, 0x3c, 0x21, 0x4, 0x1, 0x11, 0xa8, 0x0, 0x1a, 0x13, 0xbe, 0x20, 0xfe, 0x23, 0x7d, 0xfe, 0x34, 0x20, 0xf5, 0x6, 0x19, 0x78, 0x86, 0x23, 0x5, 0x20, 0xfb, 0x86, 0x20, 0xfe, 0x3e, 0x1, 0xe0, 0x50];
    
  globals.CPU = {

    memory: new Array(0x10000),

    /**
      * Registers
      */

    PC: 0,
    SP: 0,
    
    A: 0, F: 0, get AF() { return X.Utils.hilo(this.A, this.F); }, set AF(x) { this.A = X.Utils.hi(x); this.F = X.Utils.lo(x); },
    B: 0, C: 0, get BC() { return X.Utils.hilo(this.B, this.C); }, set BC(x) { this.B = X.Utils.hi(x); this.C = X.Utils.lo(x); },
    D: 0, E: 0, get DE() { return X.Utils.hilo(this.D, this.E); }, set DE(x) { this.D = X.Utils.hi(x); this.E = X.Utils.lo(x); },
    H: 0, L: 0, get HL() { return X.Utils.hilo(this.H, this.L); }, set HL(x) { this.H = X.Utils.hi(x); this.L = X.Utils.lo(x); },
    
    get_flag: function(mask) { return !!(this.F & mask); },
    set_flag: function(mask, set) { set ? this.F |= mask : this.F &= ~mask; },
   
    get carry() { return this.get_flag(1 << 4); }, set carry(x) { this.set_flag(1 << 4, x); },
    get halfcarry() { return this.get_flag(1 << 5); }, set halfcarry(x) { this.set_flag(1 << 5, x); },
    get addsub() { return this.get_flag(1 << 6); }, set addsub(x) { this.set_flag(1 << 6, x); },
    get zero() { return this.get_flag(1 << 7); }, set zero(x) { this.set_flag(1 << 7, x); },

    flag_names: ['carry', 'halfcarry', 'addsub', 'zero'],
    
    set flags(flags) {
      for (var i = 0; i < 4; ++i)
        if (flags[i] !== undefined) this[this.flag_names[i]] = flags[i]
    },
    
    /**
      * Instructions
      */

    instructions: [],
    
    /**
      * Methods
      */
      
    read: function(address) { return this.memory[address]; },

    write: function(address, value) { return this.memory[address] = value; },

    push: function(value) {
      this.write(this.SP--, value); // Wrap ???
    },

    pop: function() {
      return this.read(this.SP++); // Wrap ???
    },

    init: function() {

      //
      this.instructions = X.InstructionImplementations.generate(this);

      // 
      this.memory = Array.apply(null, new Array(0x10000)).map(Number.prototype.valueOf,0);
    },
    
    reset: function() {
 
      // Copy bios to memory
      this.memory = Array.prototype.splice.apply(this.memory, [0, 0xFFFF].concat(this.bios));
    },
    
    l: '',
    log: function() {
      var a = [].slice.apply(arguments);
      a.forEach(function(x) {
        this.l += x + '\n';
      }.bind(this));
      if (this.l.length > 10000) {
        this.l = '';
      }
    },
    
    i: 0,
    step: function() {
      
      // Fetch
      
      this.log('PC', this.PC.toString(16));

      var opcode = this.memory[this.PC];
      opcode = opcode == 0xCB ? 0x100 + this.memory[this.PC + 1] : opcode;
      //this.log('opcode', opcode.toString(16));  

      var instruction = this.instructions[opcode];
      var bytes = parseInt(X.InstructionImplementations.opcodes[opcode][1]); // later -> just store length and cycles as numbers
      var cycles = parseInt(X.InstructionImplementations.opcodes[opcode][2]);
      //this.log(this.opcodes[opcode], instruction, bytes, cycles);
      
      var operands = this.memory.slice(this.PC + 1, this.PC + bytes);
      //this.log(operands.map(function(x){ return x.toString(16); }));
      
      // Execute
      
      this.PC += bytes;
      instruction(this, operands);
      ++this.i;
      // Check for interrupts
      
      // ...
      
      return cycles;
    }
  };

})(X || {})
var X = X || {};

X.Joypad = (function() {

  'use strict';

  var codes = [
    [65, 90, 32, 13], // Buttons: A, Z, Space, Enter
    [39, 37, 38, 40] // Directions: arrows
  ];

  var mapping = {
    "a": 65,
    "b": 90,
    "select": 32,
    "start": 13,
    "right": 39,
    "left": 37,
    "up": 38,
    "down": 40
  };

  var keys = {}; // Key states
  var selection = 0; // 0x10 -> buttons, 0x20 -> directions, otherwise -> disabled

  var to_byte = function() {

    if (selection != 0x10 && selection != 0x20)
      return 0xF;

    var selected = selection == 0x10 ? codes[0] : codes[1];
    var input = _.reduce(selected, function(byte, code, bit) {
      return byte | (keys[code] ? 0 : 1) << bit;
    }, 0);

    return input;
  };

  return {

    init: function() {

      gameControl.on('connect', function(gamepad) {

        gamepad.on('button1', function() {
          if (!keys[mapping.a]) {
            keys[mapping.a] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('button1', function() {
          if (mapping.a in keys) {
            keys[mapping.a] = false;
          }
        });

        gamepad.on('button0', function() {
          if (!keys[mapping.b]) {
            keys[mapping.b] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('button0', function() {
          if (mapping.b in keys) {
            keys[mapping.b] = false;
          }
        });

        gamepad.on('select', function() {
          if (!keys[mapping.select]) {
            keys[mapping.select] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('select', function() {
          if (mapping.select in keys) {
            keys[mapping.select] = false;
          }
        });

        gamepad.on('start', function() {
          if (!keys[mapping.start]) {
            keys[mapping.start] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('start', function() {
          if (mapping.start in keys) {
            keys[mapping.start] = false;
          }
        });

        gamepad.on('right0', function() {
          if (!keys[mapping.right]) {
            keys[mapping.right] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('right0', function() {
          if (mapping.right in keys) {
            keys[mapping.right] = false;
          }
        });

        gamepad.on('button15', function() {
          if (!keys[mapping.right]) {
            keys[mapping.right] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('button15', function() {
          if (mapping.right in keys) {
            keys[mapping.right] = false;
          }
        });

        gamepad.on('left0', function() {
          if (!keys[mapping.left]) {
            keys[mapping.left] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('left0', function() {
          if (mapping.left in keys) {
            keys[mapping.left] = false;
          }
        });

        gamepad.on('button14', function() {
          if (!keys[mapping.left]) {
            keys[mapping.left] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('button14', function() {
          if (mapping.left in keys) {
            keys[mapping.left] = false;
          }
        });

        gamepad.on('up0', function() {
          if (!keys[mapping.up]) {
            keys[mapping.up] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('up0', function() {
          if (mapping.up in keys) {
            keys[mapping.up] = false;
          }
        });

        gamepad.on('button12', function() {
          if (!keys[mapping.up]) {
            keys[mapping.up] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('button12', function() {
          if (mapping.up in keys) {
            keys[mapping.up] = false;
          }
        });

        gamepad.on('down0', function() {
          if (!keys[mapping.down]) {
            keys[mapping.down] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('down0', function() {
          if (mapping.down in keys) {
            keys[mapping.down] = false;
          }
        });

        gamepad.on('button13', function() {
          if (!keys[mapping.down]) {
            keys[mapping.down] = true;
            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        });

        gamepad.after('button13', function() {
          if (mapping.down in keys) {
            keys[mapping.down] = false;
          }
        });

      });

      document.addEventListener('keydown', function(event) {
        if (_.contains(_.flatten(codes), event.keyCode)) {
          event.preventDefault();

          if (!keys[event.keyCode]) {
            keys[event.keyCode] = true;

            X.CPU.request_interrupt(4);
            X.CPU.stopped = false; // Button presses terminate STOP
          }
        }
      });

      document.addEventListener('keyup', function(event) {
        if (event.keyCode in keys) {
          keys[event.keyCode] = false;
        }
      });
    },

    reset: function() {

      // Initialize all keys to false (up)
      _.each(_.flatten(codes), function(code) {
        keys[code] = false;
      });

      selection = 0;
    },

    r: function() {
      return to_byte();
    },

    w: function(address, value) {
      selection = value & 0x30;
    }

  };

})();

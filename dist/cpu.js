'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _utils = require('./utils');

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CPU_OPTS = ['-stats', 'pid,cpu,command', '-o', 'cpu'];

var CpuMonitor = function (_EventEmitter) {
    _inherits(CpuMonitor, _EventEmitter);

    function CpuMonitor(options) {
        _classCallCheck(this, CpuMonitor);

        var _this = _possibleConstructorReturn(this, (CpuMonitor.__proto__ || Object.getPrototypeOf(CpuMonitor)).call(this));

        _this.opts = (0, _utils.parseOptions)(CPU_OPTS, options);
        _this.top = _child_process2.default.spawn('/usr/bin/top', _this.opts);
        _this.listen();
        return _this;
    }

    _createClass(CpuMonitor, [{
        key: 'listen',
        value: function listen() {
            var _this2 = this;

            this.top.stdout.on('data', function (data) {
                _this2.parseData(data.toString());
            });

            this.on('exit', function () {
                _this2.top.kill('SIGINT');
            });
        }
    }, {
        key: 'parseData',
        value: function parseData(data) {
            var cpuUsage = this.parseCpuUsage(data);

            if (cpuUsage) {
                this.emit('cpuUsage', cpuUsage);
            }

            var topCpuProcs = this.parseTopCpuProcs(data);

            if (topCpuProcs) {
                this.emit('topCpuProcs', topCpuProcs);
            }
        }
    }, {
        key: 'parseCpuUsage',
        value: function parseCpuUsage(data) {
            var lines = data.split('\n');
            var regex = /(\d+\.\d+)% *user.*(\d+\.\d+)% *sys.*(\d+\.\d+)% *idle/;

            lines.forEach(function (line) {
                var matches = regex.exec(line);

                if (matches && matches.length === 6) {
                    return { user: matches[3], sys: matches[4], idle: matches[5] };
                }
            });
        }
    }, {
        key: 'parseTopCpuProcs',
        value: function parseTopCpuProcs(data) {
            var matches = void 0;
            var procs = [];
            var regex = /^(\d+)\s+(\d+\.\d+)\s+(.*)$/mg;

            while (matches = regex.exec(data)) {
                if (!matches || matches.length < 4) continue;

                procs.push({
                    pid: matches[1],
                    cpu: matches[2],
                    command: matches[3].trim()
                });
            }

            return procs;
        }
    }]);

    return CpuMonitor;
}(_events.EventEmitter);

exports.default = CpuMonitor;
//# sourceMappingURL=cpu.js.map
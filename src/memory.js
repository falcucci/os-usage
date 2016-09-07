import { EventEmitter } from 'events';
import { parseOptions } from './utils';
import child_process from 'child_process';

const MEM_OPTS = ['-stats', 'pid,mem,command', '-o', 'mem'];

export default class MemMonitor extends EventEmitter {
    constructor(options) {
        super();

        this.opts = parseOptions(MEM_OPTS, options);
        this.top = child_process.spawn('/usr/bin/top', this.opts);

        if (process.env.NODE_ENV !== 'test') {
            this.onData();
        }

        this.onExit();
    }

    onData() {
        this.top.stdout.on('data', (data) => {
            this.parseData(data.toString());
        });
    }

    onExit() {
        this.on('exit', () => {
            this.top.kill('SIGINT');
        });
    }

    parseData(data) {
        const memUsage = this.parseMemUsage(data);

        if (memUsage) {
            this.emit('memUsage', memUsage);
        }

        const topMemProcs = this.parseTopMemProcs(data);

        if (topMemProcs) {
            this.emit('topMemProcs', topMemProcs);
        }
    }

    parseMemUsage(data) {
        let usage;
        const lines = data.split('\n');
        const regex = / +(\d+.) +used.*\((\d+.) +wired.* *(\d+.) *unused/;

        lines.forEach((line) => {
            const matches = regex.exec(line);

            if (matches && matches.length >= 3) {
                usage = {
                    used: matches[1],
                    wired: matches[2],
                    unused: matches[3],
                    used_kb: this.parseMemInKb(matches[1]),
                    wired_kb: this.parseMemInKb(matches[2]),
                    unused_kb: this.parseMemInKb(matches[3])
                };
            }
        });

        return usage;
    }

    parseTopMemProcs(data) {
        const procs = [];
        const regex = /^(\d+)\s+(\w+).?\s+(.*)$/mg;
        let matches = regex.exec(data);

        while (matches) {
            if (!matches || matches.length < 4) continue;

            procs.push({
                pid: matches[1],
                mem: matches[2],
                command: matches[3].trim()
            });

            matches = regex.exec(data);
        }

        return procs;
    }

    parseMemInKb(mem) {
        const num = Number(mem.substring(0, mem.length-1));

        if (mem.charAt(mem.length-1) === 'M') {
            return num * 1024;
        }
        else if (mem.charAt(mem.length-1) === 'G') {
            return num * 1024 * 1024;
        }
        else if (mem.charAt(mem.length-1) === 'K') {
            return num;
        }
    }
}
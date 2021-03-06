// Generated by CoffeeScript 1.10.0
var Source, appArgs, child_process, configName, configPath, dirExists, exec, fileExists, fs, isArray, isFunction, isNumber, isObject, isString, loadConf, nanoWatch, path, procCwd, psTree, restartPause, runWatcher, searchConfig, setCwd, spawn, t, util, watch, watchFile, watchInterval,
  hasProp = {}.hasOwnProperty;

path = require('path');

util = require('util');

child_process = require('child_process');

exec = child_process.exec;

spawn = child_process.spawn;

watch = require('watch');

fs = require('fs-extra');

psTree = require('ps-tree');

configName = 'nano-watcher.json';

configPath = null;

watchInterval = 200;

restartPause = 500;

procCwd = null;

appArgs = require('minimist')(process.argv.slice(2), {
  alias: {
    config: 'c',
    interval: 'i',
    delay: 'd',
    help: 'h',
    sources: 's',
    cwd: 'cd',
    run: 'r'
  }
});

t = Object.prototype.toString;

isString = function(s) {
  return t.call(s) === '[object String]';
};

isArray = function(s) {
  return t.call(s) === '[object Array]';
};

isObject = function(s) {
  return t.call(s) === '[object Object]';
};

isFunction = function(s) {
  return t.call(s) === '[object Function]';
};

isNumber = function(s) {
  return s === s && (t.call(s) === '[object Number]');
};

fileExists = function(path) {
  var e, error1;
  try {
    return fs.statSync(path).isFile();
  } catch (error1) {
    e = error1;
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
};

dirExists = function(path) {
  var e, error1;
  try {
    return fs.statSync(path).isDirectory();
  } catch (error1) {
    e = error1;
    if (e.code === 'ENOENT') {
      return false;
    } else {
      throw e;
    }
  }
};

Date.prototype.timeNow = function(){
    return ((this.getHours() < 10)?"0":"")
    + this.getHours() + ":"
    + ((this.getMinutes() < 10)?"0":"")
    + this.getMinutes() + ":"
    + ((this.getSeconds() < 10)?"0":"")
    + this.getSeconds();};

searchConfig = function(cName) {
  var cPath, cwd, dirs, pathRoot, userConf;
  cName = cName || configName;
  cwd = process.cwd();
  pathRoot = path.parse(cwd).root;
  dirs = cwd.split(path.sep).slice(1);
  dirs.unshift(pathRoot);
  dirs.push(cName);
  userConf = null;
  while (dirs.length > 1) {
    cPath = path.join.apply(this, dirs);
    dirs.splice(-2, 1);
    if (fileExists(cPath)) {
      userConf = fs.readJsonSync(cPath);
      console.log('Config loaded:', cPath);
      if (isObject(userConf)) {
        configPath = cPath;
      } else {
        throw new Error('Wrong format of config file: ' + cPath);
      }
    }
  }
  return userConf;
};

setCwd = function(p) {
  var stat;
  stat = fs.statSync(p);
  if (stat.isFile()) {
    p = path.dirname(p);
    stat = fs.statSync(p);
  }
  if (stat.isDirectory()) {
    procCwd = p;
    return process.chdir(p);
  } else {
    throw new Error("Can't change dir to (not a directory): " + p);
  }
};

loadConf = function(cPath) {
  var conf, key, userConf, val;
  conf = {
    sources: [],
    watchInterval: appArgs.interval || 200,
    restartPause: appArgs.delay || 500
  };
  if (cPath !== undefined) {
    cPath = path.resolve(path.normalize(cPath));
    if (dirExists(cPath)) {
      cPath = path.join(cPath, configName);
    }
    if (fileExists(cPath)) {
      userConf = fs.readJsonSync(cPath);
      console.log('Config loaded:', cPath);
      if (isObject(userConf)) {
        configPath = cPath;
      } else {
        throw new Error('Wrong format of config file: ' + cPath);
      }
    } else {
      userConf = searchConfig(cPath) || {};
    }
  } else {
    userConf = searchConfig(cPath) || {};
  }
  for (key in userConf) {
    if (!hasProp.call(userConf, key)) continue;
    val = userConf[key];
    conf[key] = val;
  }
  watchInterval = conf.watchInterval;
  restartPause = conf.restartPause;
  return conf;
};

watchFile = function(file, cb) {
  var mtimePrev, xt;
  mtimePrev = fs.statSync(file).mtime.getTime();
  xt = (function(_this) {
    return function() {
      var error1, mtime, stat;
      try {
        stat = fs.statSync(file);
      } catch (error1) {
        return;
      }
      mtime = stat.mtime.getTime();
      if (mtime !== mtimePrev) {
        cb(file);
        return mtimePrev = mtime;
      }
    };
  })(this);
  return setInterval(xt, watchInterval);
};

Source = (function() {
  var cmdRun;

  cmdRun = function(cmd, file) {
    var arg, args, i, len, ref;
    args = [];
    ref = cmd.args;
    for (i = 0, len = ref.length; i < len; i++) {
      arg = ref[i];
      if (isObject(arg)) {
        switch (arg.data) {
          case 'file':
            args.push(file || arg.alt || '');
        }
      } else {
        args.push(arg);
      }
    }
    cmd.proc = spawn(cmd.app, args, cmd.spawnOpt);
    cmd.proc.stdout.on('data', function(data) {
      data = data.toString();
      if ('\n' === data.slice(-6, -5)) {
        data = data.slice(0, -6) + data.slice(-5);
      }
      if ('\n' === data.slice(-1)) {
        data = data.slice(0, -1);
      }
      if ('\n' === data.slice(-1)) {
        data = data.slice(0, -1);
      }
      return console.log('    ', cmd.name, data);
    });
    cmd.proc.stderr.on('data', function(data) {
      data = data.toString();
      if ('\n' === data.slice(-6, -5)) {
        data = data.slice(0, -6) + data.slice(-5);
      }
      if ('\n' === data.slice(-1)) {
        data = data.slice(0, -1);
      }
      if ('\n' === data.slice(-1)) {
        data = data.slice(0, -1);
      }
      return console.error('    ', cmd.name, data);
    });
    cmd.proc.on('error', function(error) {
      return console.error('---- Error in <', cmd.name, '>', error.message);
    });
    return cmd.proc.on('exit', function() {
      if (cmd.proc !== null) {
        return cmd.proc = null;
      }
    });
  };

  Source.prototype.run = function(file) {
    var cmd, i, len, ref;
    if (!this.command) {
      return;
    }
    ref = this.command;
    for (i = 0, len = ref.length; i < len; i++) {
      cmd = ref[i];
      console.log('[' + new Date().timeNow() + '] [', cmd.name, ']', file || '<no file>');
      if (cmd.proc !== null) {
        psTree(cmd.proc.pid, function(err, children) {
          spawn('kill', ['-9'].concat(children.map(function(p) {
            return p.PID;
          })));
          return setTimeout(function() {
            return cmdRun(cmd, file);
          }, 500);
        });
      } else {
        cmdRun(cmd, file);
      }
    }
    return this;
  };

  Source.prototype.runAll = function() {};

  Source.prototype.watchTree = function(dir) {
    var ext, wOpt, xt;
    wOpt = {
      persistent: true,
      interval: watchInterval,
      ignoreDotFiles: true,
      ignoreUnreadableDir: true,
      ignoreNotPermitted: true,
      ignoreDirectoryPattern: /node_modules/
    };
    if (this.ext !== void 0) {
      ext = this.ext;
      wOpt.filter = (function(_this) {
        return function(file) {
          return -1 !== ext.indexOf(path.extname(file).slice(1));
        };
      })(this);
    }
    xt = (function(_this) {
      return function(f, curr, prev) {
        if (prev !== null && curr !== null && !isObject(f)) {
          console.log('f', f);
          return _this.run(f);
        }
      };
    })(this);
    watch.watchTree(dir, wOpt, xt);
    return this;
  };

  Source.prototype.stopFile = function() {
    if (this.fileWatchInterval !== undefined) {
      stopInterval(this.fileWatchInterval);
    }
    return this;
  };

  Source.prototype.stopTree = function() {
    watch.unwatchTree(this.fullSrcPath);
    return this;
  };

  Source.prototype.stop = function() {
    this.stopFile().stopTree();
    return this;
  };

  Source.prototype.watch = function() {
    var srcPath;
    srcPath = fs.statSync(this.fullSrcPath);
    if (srcPath.isFile()) {
      this.fileWatchInterval = watchFile(this.fullSrcPath, (function(_this) {
        return function(f) {
          return _this.run(f);
        };
      })(this));
    } else if (srcPath.isDirectory()) {
      this.watchTree(this.fullSrcPath);
    } else {
      throw new Error('Wrong source.path type (not file or directory): ' + this.path);
    }
    return this;
  };

  function Source(opt) {
    var c, cmd, command, i, len;
    if (!isObject(opt)) {
      throw new Error('Wrong options format. Expect: "Object" Get: "' + t.call(opt) + '"');
    }
    this.path = opt.path || './';
    this.ext = opt.ext || [];
    this.fullSrcPath = path.resolve('./', this.path);
    command = opt.command;
    if (isString(command)) {
      this.command = [
        {
          app: command,
          path: command.path || './'
        }
      ];
    } else if (command !== undefined) {
      if (isObject(command)) {
        command = [command];
      }
      if (!isArray(command)) {
        throw new Error('source.command is not String, Object or Array of Objects');
      }
      this.command = [];
      for (i = 0, len = command.length; i < len; i++) {
        cmd = command[i];
        if (cmd.app === undefined) {
          throw new Error('command.app is undefined');
        }
        if (cmd.args) {
          cmd.args = isArray(cmd.args) ? cmd.args : [cmd.args.toString()];
        }
        c = {
          app: cmd.app,
          name: cmd.name || cmd.app,
          path: cmd.path || this.path,
          args: cmd.args || [],
          proc: null
        };
        c.spawnOpt = {
          cwd: path.resolve(c.path)
        };
        this.command.push(c);
      }
    }
  }

  return Source;

})();

runWatcher = function(sources) {
  var i, len, results, s, src;
  if (sources) {
    results = [];
    for (i = 0, len = sources.length; i < len; i++) {
      src = sources[i];
      s = new Source(src);
      sources.push(s);
      if (appArgs.run === undefined) {
        results.push(s.watch());
      } else {
        results.push(s.runAll());
      }
    }
    return results;
  }
};

nanoWatch = function() {
  var conf, cwd, err, error1;
  if (appArgs.help !== undefined) {
    console.log('This is empty help (fix me, please)');
    return;
  }
  try {
    conf = loadConf(appArgs.config);
  } catch (error1) {
    err = error1;
    throw new Error(err);
  }
  cwd = appArgs.cwd || configPath;
  if (cwd) {
    setCwd(cwd);
  }
  if (configPath !== null) {
    watchFile(configPath, (function(_this) {
      return function() {
        var e, error2, i, len, newConf, ref, src;
        try {
          newConf = loadConf(configPath);
        } catch (error2) {
          e = error2;
          console.error(e);
          throw new Error('Config load error:');
        }
        ref = conf.sources;
        for (i = 0, len = ref.length; i < len; i++) {
          src = ref[i];
          src.stop();
        }
        conf = newConf;
        return runWatcher(conf.sources);
      };
    })(this));
  }
  return runWatcher(conf.sources);
};

module.exports = nanoWatch;

//# sourceMappingURL=nano-watcher.js.map

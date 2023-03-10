var generateStream= require('./lib/generateStream')
var parseStream=require('./lib/parseStream')
var writeToStream=require('./lib/writeToStream')
var Duplexify=require('duplexify')
var inherits=require('inherits')
function emitPacket (packet){
	this.emit(packet.cmd,packet)
}
function Connection(duplex,opts,cb){
	if(!(this instanceof Connection)){
		return new Connection(duplex,opts)
	}if(typeof opts=='function'){
		cb=opts
		opts={}
	}
	opts=opts||{}
	this._generator=writeToStream(duplex,opts)
	this._parser=parseStream(opts)
	process.nextTick(()=>{
		duplex.pipe(this._parser)
	})
	this._generator.on('error',this.emit.bind(this,'error'))
	this._parser.on('error',this.emit.bind(this,'error'))
	this.stream=duplex
	duplex.on('error',this.emit.bind(this,'error'))
	duplex.on('close',this.emit.bind(this,'close'))
	Duplexify.call(this,this._generator,this._parser,{objectMode:true})
	if (opts.notData !== true) {
    var that = this
    this.once('data', function (connectPacket) {
      that.setOptions(connectPacket, opts)
      that.on('data', emitPacket)
      if (cb) {
        cb()
      }
      that.emit('data', connectPacket)
    })
  }
}

inherits(Connection, Duplexify)

;['connect',
  'connack',
  'publish',
  'puback',
  'pubrec',
  'pubrel',
  'pubcomp',
  'subscribe',
  'suback',
  'unsubscribe',
  'unsuback',
  'pingreq',
  'pingresp',
  'disconnect',
  'auth'
].forEach(function (cmd) {
  Connection.prototype[cmd] = function (opts, cb) {
    opts = opts || {}
    opts.cmd = cmd

    this.write(opts)
    if (cb) setImmediate(cb)
  }
})

Connection.prototype.destroy = function () {
  if (this.stream.destroy) this.stream.destroy()
  else this.stream.end()
}

Connection.prototype.setOptions = function (packet, opts) {
  let options = {}
  Object.assign(options, packet)
  // Specifically set the protocol version for client connections
  if (options.cmd === 'connack') {
    options.protocolVersion = opts && opts.protocolVersion ? opts.protocolVersion : 4
  }
  this.options = options
  this._parser.setOptions(options)
  this._generator.setOptions(options)
}

module.exports = Connection
module.exports.parseStream = parseStream
module.exports.generateStream = generateStream


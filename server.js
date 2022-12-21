var net = require('net')
var mqttCon = require('mqtt-connection')
var server = new net.Server()

server.on('connection', function (stream) {
  var client = mqttCon(stream)

  client.on('connect', function (packet) {
    
    client.connack({ returnCode: 0 });
  })

  
  client.on('publish', function (packet) {
    
    client.puback({ messageId: packet.messageId })
  })

  
  client.on('pingreq', function () {
    
    client.pingresp()
  });

  
  client.on('subscribe', function (packet) {
    
    client.suback({ granted: [packet.qos], messageId: packet.messageId })
  })

  // timeout idle streams after 5 minutes
  stream.setTimeout(1000 * 60 * 5)

  
  client.on('close', function () { client.destroy() })
  client.on('error', function () { client.destroy() })
  client.on('disconnect', function () { client.destroy() })

  
  stream.on('timeout', function () { client.destroy(); })
})


server.listen(1883)
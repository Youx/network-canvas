#!/usr/bin/env ruby

require 'net/http'
require 'json'

meta = JSON.parse(File.read('offline/meta.json'))
data = JSON.parse(File.read('offline/data.json'))

app = proc do |ev|
  ret = ""
  options = {}
  req_path = ev['REQUEST_PATH'].split('/')
  options[:user] = req_path[1]
  options[:repo] = req_path[2]
  options[:page] = req_path[3]
  case options[:page]
    when 'network_meta'
      ret = meta.to_json
      typ = 'text/json'
    when 'network_data_chunk'
      start, finish = 558,758
      query = {}
      ev['QUERY_STRING'].split('&').each do |arg|
        args = arg.split('=')
        query[args[0]] = args[1]
      end
      if (query['start'] && query['end'])
        start, finish = query['start'].to_i, query['end'].to_i
      end
      gen = {}
      gen['commits'] = data['commits'][start..finish]
      ret = gen.to_json
      typ = 'text/json'
    when 'network.js'
      ret = File.read('network.js')
      typ = 'text/javascript'
    when 'network'
      ret = File.read('index.html')
      typ = 'text/html'
    when 'jquery-1.3.2.min.js'
      ret = File.read('jquery-1.3.2.min.js')
      type = 'text/javascript'
    else
      nil
  end

  return [ 200,
    {'Content-Type' => typ,
    'Content-Length' => ret.length.to_s},
    [ret] ]
end

use Rack::CommonLogger

run app

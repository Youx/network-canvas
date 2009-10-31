network-canvas
==============

What it is
----------

network-canvas is a reimplementation of github's network graph using HTML5 canvas element instead of flash.

AFAIK, Canvas is supported by chrome, firefox 3+, opera and safari, so unless you are using IE or an old version of these browsers you shouldn't have any problem.

Note that the original network flash file is 110kB large. The network.js file is only 25kB! Event better, it can be shrinked to less than 4kB by using [YUICompressor](http://developer.yahoo.com/yui/compressor) on the file and gzip compression on your server.

Live example
------------

Try it here, it uses mojombo/eventmachine as a sample project : [example](http://hugo.golgoth.net/network-canvas)

How to use it
-------------

This is currently beta quality, NOT FOR USE. You've been warned.

First, grab the code, put it in an apache folder, and try accessing index.html.

Since we can't do AJAX requests to external servers (that would be cross site scripting, considered by browsers as an attack vector), we have to use a php script to proxy the request to retrieve the data chunks from github.

The data used is streamed from mojombo's eventmachine project on github, though you can change that in config.php

Screenshot
----------

![Screenshot as of 23/10/2009](http://cloud.github.com/downloads/Youx/network-canvas/network-canvas.png)

/* Copyright 2009-2010 Hugo Camboulive <hugo DOT camboulive AT gmail DOT com>
 * Licensed under a BSD license */

/* Note about canvas multi text line functions :
 * It kinda sucks that the canvas does not provide its own
 * functions. This function considers the input data's width
 * is evenly distributed around characters. A sentence like
 * "AAAAAAAA aaaaaaaa" split in two may pose problem. A rewrite
 * will be necessary, but not a priority */
/* This function returns the number one lines we need to use to
 * write text over a length < maxwidth. It is only completely
 * correct when using a monotype font but should be approximate
 * enough for most uses. Use a margin just in case */
CanvasRenderingContext2D.prototype.measureTextLines = function(str, maxwidth) {
	var pixlen = this.measureText(str).width;
	if (pixlen < maxwidth)
		return 1;
	return str.splitLine(parseInt(maxwidth * str.length / pixlen))[0];
};

/* This function draws text in a multiline way over over a
 * length < maxwidth. It is only completely correct when
 * using a monotype font but should be approximate enough
 * for most uses. Use a margin just in case */
CanvasRenderingContext2D.prototype.fillTextMultiLine = function(str, x, y, maxWidth, lineHeight) {
	lineHeight = lineHeight || 12; /* default spacing = 12 */
	var pixlen = this.measureText(str).width;
	var strings = str.splitLine(parseInt(maxWidth * str.length / pixlen))[1];
	var string_ar = strings.split("\n");
	for(var i = 0 ; i < string_ar.length ; i++) {
		y += lineHeight;
		this.fillText(string_ar[i], x, y);
	}
};

/* Line Splitter Function
 * copyright Stephen Chapman, 19th April 2006
 * you may copy this code but please keep the copyright notice as well */
String.prototype.splitLine = function(n) {
	var b = '';
	var s = this;
	var linecount = 1;
	while (s.length > n) {
		var c = s.substring(0,n);
		var d = c.lastIndexOf(' ');
		var e =c.lastIndexOf('\n');
		if (e != -1)
			d = e;
		if (d == -1)
			d = n;
		b += c.substring(0,d) + '\n';
		linecount += 1;
		s = s.substring(d+1);
	}
	return [linecount, b+s];
}

/* Constructor for a network canvas, we need to give it
 * a canvas ID */
NetworkCanvas = function(canvasid, width, height, names_width, meta, data) {
	this.canvas = $('#'+canvasid).get(0);
	this.height = height || 600;
	this.width = width || 920;
	this.canvas.width = this.width;
	this.canvas.height = this.height;

	this.names_width = names_width || 100;
	/* more stuff */
	this.xoffset = this.names_width;/* the left column with names is 100 px wide */
	this.yoffset = 40;		/* the two month/day bars at the top take 40px */

	this.dotsMouseOver = [];	/* here we store the dots we can hover */
	this.avatars = {};		/* we store images loaded from gravatars in there */

	this.drawLabels = true;

	this.maxx = - this.width + (this.xoffset * 2);
	/* the +100 is just a margin in case we need to display HEADS */
	this.maxy = - this.height + (this.yoffset * 2) + 100;
	this.loading = false;
	/* we iterate of those colors when drawing branches... later we'll include more */
	this.branchColor = ["black", "red", "blue", "lawngreen", "magenta", "yellow", "orange", "cyan", "hotpink", "peru"];
	this.usersBySpace = [];

	/* Initialize mouse handler */
	this.mouse = new NetworkCanvas.Mouse(this);
	this.mouse.init();
	/* Initialize keyboard handler */
	this.keyboard = new NetworkCanvas.Keyboard(this);
	this.keyboard.init();

	/* Initialize the data loader */
	this.dataManager = new NetworkCanvas.DataManager(this);
	this.dataManager.init(meta, data);
};

NetworkCanvas.prototype = {
	/* The main draw function, it load the context from the canvas
	 * and draws everything on it. It's called everytime we have
	 * to update the graphics. */
	draw: function() {
		/* if the data is not loaded yet, draw nothing */
		if (!this.dataManager.meta)
			return;
		if (!this.dataManager.data)
			return;

		/* retreive the canvas */
		if (this.canvas.getContext){
			var ctx = this.canvas.getContext('2d');
			ctx.font = "small sans-serif";
			this.drawBlocks(ctx);
			/* draw the data points and arrows */
			this.drawData(ctx);
			/* draw the names on the left */
			this.drawNames(ctx);
			/* draw the month bar */
			this.drawMonthBar(ctx);
			/* draw the day bar */
			this.drawDayBar(ctx);
			/* draw the months/days in the two bars */
			this.drawDates(ctx);
			/* hide the first 100px of the months/days bars */
			ctx.fillStyle = "black";
			ctx.fillRect(0,0,this.names_width,20);
			ctx.fillStyle = "rgb(64,64,64)";
			ctx.fillRect(0,20,this.names_width,20);
			if (this.drawDot)
				this.drawHint(ctx, this.drawDot);
		}
	},
	/* Draw a 'hint' when a dot is mouse-hovered
	 * It's basically a rectangle with smooth corners
	 * a gravatar image + name + hash of the commit + comment */
	drawHint: function(ctx, hint) {
		var x = (this.names_width * 2) + (20 * hint.time) - this.xoffset + 10;
		var y = 80 + 20 * hint.space - this.yoffset - 10;
		/* compute the height of the hint box */
		ctx.font = "small sans-serif";
		ctx.fillStyle = "black";
		var txtlen = ctx.measureTextLines(hint.message, 400 - 15 - 15);
		var maxy = 70 + txtlen * 15 + 5;
		/* reposition the hint horizontally */
		if (x + 10 + 400 > this.width) {
			x = this.width - 400 - 10;
		} else if (x + 10 < this.names_width) {
			x = this.names_width + 10;
		} else {
			x += 10;
		}
		/* reposition the hint vertically */
		if (y + 10 + maxy > this.height) {
			/* not enough space under the dot */
			y = Math.max(40, y - 10 - maxy);
		} else if (y < 40) {
			y = 40 + 10;
		} else {
			y += 10;
		}
		/* draw the smoothed rectangle */
		ctx.beginPath();
		ctx.strokeStyle = "black";
		ctx.fillStyle = "white";
		ctx.lineWidth = "2";
		ctx.moveTo(x,y+5);
		ctx.quadraticCurveTo(x, y, x+5, y);
		ctx.lineTo(x + 400 - 5, y);
		ctx.quadraticCurveTo(x + 400, y, x + 400, y + 5);
		ctx.lineTo(x + 400, y + maxy - 5);
		ctx.quadraticCurveTo(x + 400, y + maxy, x + 395, y + maxy);
		ctx.lineTo(x + 5, y + maxy);
		ctx.quadraticCurveTo(x, y + maxy, x, y + maxy - 5);
		ctx.lineTo(x, y + 5);
		ctx.fill();
		ctx.stroke();
		/* Preload the avatar if it hasn't already been loaded */
		if (!this.avatars[hint.gravatar]) {
			this.avatars[hint.gravatar] = new Image();
			this.avatars[hint.gravatar].src = "http://www.gravatar.com/avatar/"+hint.gravatar+"?s=32";
			var ths = this;
			this.avatars[hint.gravatar].onload = function() {
				if (hint == ths.drawDot)
					ctx.drawImage(ths.avatars[hint.gravatar], x + 15, y + 15);
			};
		} else {
			ctx.drawImage(this.avatars[hint.gravatar], x + 15, y + 15);
		}
		/* Add name */
		ctx.fillStyle = "black";
		ctx.font = "medium sans-serif";
		ctx.fillText(hint.author, x + 15 + 32 + 15, y + 35);
		/* Add commit hash */
		ctx.font = "small sans-serif";
		ctx.fillStyle = "grey";
		ctx.fillText(hint.id, x + 15, y + 65);
		/* Add commit message */
		ctx.font = "small sans-serif";
		ctx.fillStyle = "black";
		ctx.fillTextMultiLine(hint.message, x + 15, y + 70, 400 - 15 - 15);
	},
	/* Draw the black month bar at the top of the canvas */
	drawMonthBar: function(ctx) {
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,this.width,20);
	},
	/* Draw the grey day bar just under the month bar */
	drawDayBar: function(ctx) {
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillRect(0,20,this.width,20);
	},
	/* Draw a name block in the left bar */
	drawNameBlock: function(ctx, idx) {
		var colors = ["rgb(235,235,255)", "rgb(224,224,255)"];
		var val = this.dataManager.meta.blocks[idx];
		var ystart = 80 + val.start * 20;
		var yend = ystart + val.count * 20;
		
		if ( (ystart - this.yoffset >= 40 && ystart - this.yoffset <= this.height) ||
		     (yend - this.yoffset >= 40 && yend - this.yoffset <= this.height) ) {
			/* draw the background */
			if (this.mouse.lastPoint.y > ystart - this.yoffset &&
				this.mouse.lastPoint.y <= yend - this.yoffset &&
				this.mouse.lastPoint.x <= this.names_width) {
				/* hovered */
				ctx.fillStyle = "rgb(223,223,243)";
				ctx.fillRect(0, ystart - this.yoffset, this.names_width, val.count * 20);
			} else if (idx%2 == 1) {
				/* odd lines */
				ctx.fillStyle = "rgb(224,224,255)";
				ctx.fillRect(0, ystart - this.yoffset, this.names_width, val.count * 20);
			}
			/* draw border */
			ctx.strokeStyle = "rgb(222,222,222)";
			ctx.lineWidth = "1";
			ctx.beginPath();
			ctx.moveTo(this.names_width, ystart - this.yoffset + 0.5);
			ctx.lineTo(0.5, ystart - this.yoffset + 0.5);
			ctx.lineTo(0.5, yend - this.yoffset + 0.5);
			ctx.lineTo(this.names_width, yend - this.yoffset + 0.5);
			ctx.stroke();
			/* draw text */
			ctx.fillStyle = "black";
			ctx.fillText(val.name, 5, (ystart + yend) / 2 - this.yoffset + 5, this.names_width - 10);
		}
	},
	/* Draw the names of each repository owner in the left column */
	drawNames: function(ctx) {
		ctx.save();
		ctx.fillStyle = "rgb(235,235,255)";
		ctx.fillRect(0, 40, this.names_width, this.height - 40)
		for (var i = 0 ; i < this.dataManager.meta.blocks.length ; i++) {
			this.drawNameBlock(ctx, i);
		}
		ctx.restore();
	},
	/* Draw the to the right of each name in the right column */
	drawBlocks: function(ctx) {
		var colors = ["rgb(245,245,255)", "rgb(240,240,255)"];
		var y = 80;
		ctx.save();
		ctx.fillStyle = colors[0];
		ctx.fillRect(this.names_width, 40, this.width - this.names_width, this.height - 40)
		for (var i = 0 ; i < this.dataManager.meta.blocks.length ; i++) {
			var val = this.dataManager.meta.blocks[i];
			var ydest = y + val.count * 20;
			if ( (y - this.yoffset >= 40 && y - this.yoffset <= this.height) ||
			     (ydest - this.yoffset >= 40 && ydest - this.yoffset <= this.height) ) {
				if (i%2 == 1) {
					ctx.fillStyle = colors[1];
					ctx.fillRect(this.names_width, y - this.yoffset, this.width - this.names_width, val.count * 20);
				}
				ctx.lineWidth = "1";
				ctx.strokeStyle = "rgb(222,222,222)";
				ctx.strokeRect(0.5, y - this.yoffset + 0.5, this.width - 0.5, val.count * 20);
			}
			y += val.count * 20;
		}
		ctx.restore();
	},
	/* Draw the dates in the two bars at the top of the canvas
	 * (month in the first bar and day in the second bar */
	drawDates: function(ctx) {
		/* used to transform a month number to a 3 character string */
		var valtomonth = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
			"07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"};
		var olddate;
		var newdate;
		var min = parseInt((this.xoffset - this.names_width)/20);
		if (min <= 0)
			olddate = [1970,1,1];
		else
			olddate = this.dataManager.meta.dates[min - 1].split("-");

		for (var i = parseInt((this.xoffset - this.names_width)/20) ; i <= parseInt((this.xoffset - this.names_width)/20 + 50) ; i++) {
			var val = this.dataManager.meta.dates[i];
			if (!val)
				continue;
			newdate = val.split("-");
			var x = (2 * this.names_width) + 20 * i - this.xoffset;
			/* Check if we need to display a new month */
			if (newdate[0] != olddate[0] || newdate[1] != olddate[1]) {
				ctx.fillStyle = "white";
				ctx.fillText(valtomonth[newdate[1]], x, 15)
			}
			/* Check if we need to display a new day */
			if (newdate[0] != olddate[0] || newdate[1] != olddate[1] || newdate[2] != olddate[2]) {
				ctx.fillStyle = "rgb(192,192,192)";
				ctx.fillText(newdate[2], x, 35)
			}
			olddate = newdate;
		}
	},
	/* Draw a little branch head label under a dot */
	drawHead: function(ctx, label, x, y) {
		ctx.save();
		ctx.font = "10px monospace"
		var size = ctx.measureText(label).width;
		/* draw the shape */
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.globalAlpha = 0.8;
		ctx.moveTo(x, y);
		ctx.lineTo(x - 4, y + 10);
		ctx.quadraticCurveTo(x - 8, y + 10, x - 8, y + 15);
		ctx.lineTo(x - 8, y + 15 + size);
		ctx.quadraticCurveTo(x - 8, y + 15 + size + 5, x - 4, y + 15 + size + 5);
		ctx.lineTo(x + 4, y + 15 + size + 5);
		ctx.quadraticCurveTo(x + 8, y + 15 + size + 5, x + 8, y + 15 + size);
		ctx.lineTo(x + 8, y + 15);
		ctx.quadraticCurveTo(x + 8, y + 10, x + 4, y + 10);
		ctx.lineTo(x, y);
		ctx.fill();
		/* print the text */
		ctx.globalAlpha = 1.0;
		ctx.fillStyle = "white";
		ctx.textBaseline = "middle";
		ctx.rotate(Math.PI / 2);
		ctx.fillText(label, y + 15 , - x);
		ctx.rotate(- Math.PI / 2);
		ctx.restore();
		return size + 5 + 15; /* 5 = bottom border, 15 = top border */
	},
	drawDataDots: function(ctx) {
		this.dotsMouseOver = [];
		/* Draw all the dots */
		for (var i = parseInt((this.xoffset - this.names_width)/20) ; i <= parseInt((this.xoffset - this.names_width + this.width)/20) ; i++) {
			var val = this.dataManager.getCommit(i);
			if (!val)
				continue;
			var x = (this.names_width * 2) + (20 * val.time) - this.xoffset + 10;
			var y = 80 + 20 * val.space - this.yoffset - 10;
			/* draw the dot */
			if (x > this.names_width - 20 && x < this.width + 20 && y > 20 && y < this.height + 20) {
				ctx.beginPath();
				if (val == this.drawDot) {
					/* we are hovering a dot, draw it bigger
					 * and add a hint */
					ctx.fillStyle = "white";
					ctx.arc(x, y, 6, 0, (Math.PI * 2), false);
					ctx.fill();
					ctx.beginPath();
					ctx.fillStyle = this.branchColor[(val.space-1)%this.branchColor.length];
					ctx.arc(x, y, 5, 0, (Math.PI * 2), false);
					ctx.fill();
				} else {
					/* only draw a small dot */
					ctx.fillStyle = this.branchColor[(val.space-1)%this.branchColor.length];
					ctx.arc(x, y, 3, 0, (Math.PI * 2), false);
					ctx.fill();
				}
				/* add the data to the array of dotsmouseover */
				this.dotsMouseOver.push({"x":x, "y": y, "val": val});
			}
		}
	},
	drawDataHeads: function(ctx) {
		/* Draw all the HEADS */
		for (var i = parseInt((this.xoffset - this.names_width)/20) ; i <= parseInt((this.xoffset - this.names_width + this.width)/20) ; i++) {
			var val = this.dataManager.getCommit(i);
			if (!val)
				continue;
			var x = (this.names_width * 2) + (20 * val.time) - this.xoffset + 10;
			var y = 80 + 20 * val.space - this.yoffset - 10;
			var yhead = y + 5;
			if (this.dataManager.heads[this.usersBySpace[val.space - 1].name] && this.dataManager.heads[this.usersBySpace[val.space - 1].name][val.id]) {
				for (var j = 0 ; j < this.dataManager.heads[this.usersBySpace[val.space - 1].name][val.id].length ; j++) {
					var label = this.dataManager.heads[this.usersBySpace[val.space - 1].name][val.id][j];
					yhead += this.drawHead(ctx, label, x, yhead) + 5;
				}
			}
		}
	},
	drawDataLinks: function(ctx) {
		/* draw points */
		var displaycount = 0;
		for (var i = this.dataManager.meta.dates.length - 1; i >= parseInt((this.xoffset - this.names_width)/20) ; i--) {
			var val = this.dataManager.getCommit(i);
			if (!val)
				continue;
			var x = (this.names_width * 2) + (20 * val.time) - this.xoffset + 10;
			var y = 80 + 20 * val.space - this.yoffset - 10;
			ctx.strokeStyle = this.branchColor[(val.space-1)%this.branchColor.length];
			ctx.lineWidth = 2;

			var middle_used = false;
			for (var j = 0 ; j < val.parents.length ; j++) {
				var parnt = val.parents[j];
				if (parnt[2] == val.space) {
					middle_used = true;
				}
			}
			/* for each dot, we ~may~ have to draw the line/arrow
			 * to its parent. */
			for (var j = 0 ; j < val.parents.length ; j++) {
				var parnt = val.parents[j];
				var xdest = (this.names_width * 2) + (20 * parnt[1]) - this.xoffset + 10;
				var ydest = 80 + 20 * parnt[2] - this.yoffset - 10;
				/* Check if the line can be seen */
				if (!this.needToDrawLine(x, y, xdest, ydest))
					continue;
				/* here we can draw different type of lines/arrows */
				if (parnt[2] == val.space) {
					/* the dots are on the same line,
					 * we only draw a line */
					ctx.beginPath();
					ctx.strokeStyle = this.branchColor[(val.space-1)%this.branchColor.length];
					ctx.moveTo(x - 5, y);
					ctx.lineTo(xdest + 5, y);
					ctx.stroke();
				} else if (parnt[2] > val.space) {
					/* the parent is > than the current
					 * this will be a merge arrow */
					ctx.beginPath();
					ctx.lineWidth = 2;
					ctx.strokeStyle = this.branchColor[(parnt[2]-1)%this.branchColor.length];
					ctx.fillStyle = this.branchColor[(parnt[2]-1)%this.branchColor.length];
					ctx.moveTo(xdest + 5, ydest);
					ctx.lineTo(x - 11, ydest);
					ctx.lineTo(x - 11, y + 13);
					ctx.lineTo(x - 9, y + 9);
					ctx.stroke();
					/* draw arrowhead */
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.moveTo(x - 5, y + 5);
					ctx.lineTo(x - 13, y + 8);
					ctx.lineTo(x - 7, y + 14);
					ctx.lineTo(x - 5, y + 5);
					ctx.fill();
				} else {
					/* the parent is < the current, this
					 * will be a fork arrow */
					if (middle_used == false) {
						ctx.beginPath();
						ctx.strokeStyle = this.branchColor[(val.space-1)%this.branchColor.length];
						ctx.fillStyle = this.branchColor[(val.space-1)%this.branchColor.length];
						/* draw arrowhead */
						ctx.lineWidth = 1;
						ctx.moveTo(x - 5, y);
						ctx.lineTo(x - 5 - 9, y - 3.5);
						ctx.lineTo(x - 5 - 9, y + 3.5);
						ctx.lineTo(x - 5, y);
						ctx.fill();
						/* draw lines */
						ctx.beginPath();
						ctx.lineWidth = 2;
						ctx.moveTo(x - 5 - 8, y);
						ctx.lineTo(xdest, y);
						ctx.lineTo(xdest, ydest + 5);
						ctx.stroke();
					} else {
						ctx.beginPath();
						ctx.lineWidth = 2;
						ctx.strokeStyle = this.branchColor[(val.space-1)%this.branchColor.length];
						ctx.fillStyle = this.branchColor[(val.space-1)%this.branchColor.length];
						ctx.moveTo(xdest, ydest + 5);
						ctx.lineTo(xdest, y - 12);
						ctx.lineTo(x - 12, y - 12);
						ctx.lineTo(x - 9, y - 9);
						ctx.stroke();
						/* draw arrowhead */
						ctx.beginPath();
						ctx.lineWidth = 1;
						ctx.moveTo(x - 5, y - 5);
						ctx.lineTo(x - 13, y - 8);
						ctx.lineTo(x - 7, y - 14);
						ctx.lineTo(x - 5, y - 5);
						ctx.fill();
					}
				}
			}
		}
	},
	/* Draw the dots and arrows / links in the canvas.
	 * We may also draw a hint if a dot is hovered */
	drawData: function(ctx) {
		this.drawDataLinks(ctx);
		this.drawDataDots(ctx);
		if (this.drawLabels)
			this.drawDataHeads(ctx);
	},
	/* Calculate if we will need to draw an arrow (two segments)
	 * in this canvas (the whole data is bigger than the canvas, so
	 * we can't afford to draw everything, especially on big graphs) */
	needToDrawLine: function(xorig, yorig, xdest, ydest) {
		/* both dots are higher than the canvas, no need to draw */
		if (xorig < this.names_width && xdest < this.names_width)
			return false;
		/* both dots are lower than the canvas, no need to draw */
		if (xorig > this.width && xdest > this.width)
			return false;
		/* both dots are lefter than the canvas, no need to draw */
		if (yorig < 40 && ydest < 40)
			return false;
		/* both dots are righter than the canvas, no need to draw */
		if (yorig > this.height && ydest > this.height)
			return false;
		/* those two are a bit trickier, but work */
		/*if ( (xorig < xmin || xorig > xmax) && (ydest < ymin || ydest > ymax) )
			return false;
		if ( (xdest < xmin || xdest > xmax) && (yorig < ymin || yorig > ymax) )
			return false;*/
		/* if we are here, we have to draw */
		return true;
	}
};

/******* Here starts the data loading mechanics *******/
NetworkCanvas.DataManager = function(c) {
	this.canvas = c;
	this.meta;			/* the metadata loaded from 'network_meta' file */
	this.data = [];			/* the data loaded from 'network_data?nethash=<hash>&start=<s>&end=<e> */
	this.heads = {};
	this.loading = [];
};

NetworkCanvas.DataManager.prototype = {
	init: function(meta, data) {
		var ths = this;
		if (meta != null && data != null) {
			this.meta = meta;
			this.parseMeta();
			this.canvas.xoffset = ths.canvas.names_width + ths.meta.focus * 20;
			this.loadStartData(data);
		} else {
			$.getJSON("network_meta", function(metadata) {
				ths.meta = metadata;
				ths.parseMeta();
				ths.canvas.xoffset = ths.canvas.names_width + ths.meta.focus * 20;
				ths.loadStartData();
			});
		}
	},
	/* Compute the max width and height of the data inside the
	 * canvas so we can block scrolling when going too far
	 * We also put the HEADS in an associative array */
	parseMeta: function() {
		/* each user can take 20px * X in height */
		for (var i = 0 ; i < this.meta.blocks.length ; i++) {
			this.canvas.maxy += 20 * this.meta.blocks[i].count;
			for (var j = 0 ; j < this.meta.blocks[i].count ; j++) {
				this.canvas.usersBySpace[this.meta.blocks[i].start + j] = this.meta.users[i];
			}
		}
		/* each column takes 20px */
		this.canvas.maxx = 100 + (this.meta.dates.length * 20);
		/* parse the heads */
		for (var i = 0 ; i < this.meta.users.length ; i++) {
			var val = this.meta.users[i];
			if(!this.heads[val.name])
				this.heads[val.name] = {};
			for (var j = 0 ; j < val.heads.length ; j++) {
				var head = val.heads[j];
				if (!this.heads[val.name][head.id])
					this.heads[val.name][head.id] = [];
				this.heads[val.name][head.id].push(head.name);
			}
		}
	},
	parseDataChunk: function(chunk) {
		for (var i = 0 ; i < chunk.commits.length ; i++) {
			var commit = chunk.commits[i];
			this.data[commit.time] = commit;
		}
	},
	loadStartData: function(data) {
		var ths = this;
		if (data) {
			ths.parseDataChunk(data);
			ths.canvas.draw();
		} else {
			$.getJSON("network_data_chunk?nethash="+ths.meta.nethash, function(chunk) {
				ths.parseDataChunk(chunk);
				ths.canvas.draw();
			});
		}
	},
	getCommit: function(i) {
		var ths = this;
		/* if there is no existing data loaded */
		if (!this.data[i] && i < this.meta.dates.length && i >= 0 && (!this.loading[i] || this.loading[i] == false)) {
			var start;
			if (i >= 1 && this.data[i - 1]) {
				/* there is something on the left */
				start = i;
			} else {
				start = Math.max(i - 100, 0);
			}
			var end = Math.min(start + 100, this.meta.dates.length - 1);
			for (var j = start ; j <= end ; j++) {
				this.loading[j] = true;
			}
			if (!this.canvas.loading) {
				this.loadData();
			}
		}
		return this.data[i];
	},
	loadData: function() {
		var ths = this;
		var len = 0;
		this.canvas.loading = true;

		for (var i = 0 ; i < this.loading.length ; i++)
			if (this.loading[i] && !this.data[i])
				len++;
		while(len > 0) {
			var end = this.loading.length - 1;
			while (!this.loading[end] || this.data[end]) {
				end--;
			}
			var start = end;
			while (start > 0 && this.loading[start] && end - start < 100 && !this.data[start])
				start--;

			$.ajax({
				async: false,
				dataType: "json",
				url: "network_data_chunk?nethash="+this.meta.nethash+"&start="+start+'&end='+end,
				success: function(d) {
					ths.parseDataChunk(d);
					ths.canvas.draw();
				}
			});

			for (var i = end; i >= start ; i--)
				this.loading[i] = false;
			len = 0;
			for (var i = 0 ; i < this.loading.length ; i++)
				if (this.loading[i] && !this.data[i])
					len++;
		}
		this.canvas.loading = false;
	}
};

/******* Here starts the mouse management mechanics *******/
NetworkCanvas.Mouse = function(c) {
	this.dragging = false;		/* is the mouse button pressed right now? */
	this.lastPoint = {"x":0, "y":0}; /* last coords of the mouse */
	this.drawDot = false;		/* the dot that we are hovering */
	this.canvas = c;
	/* once the onmouse* are bound to the canvas, the parent is the canvas
	 * so we can't access this.*, we have to use a variable local to the
	 * constructor that references itself. Funny stuff */
	var parnt = this;

	/* When the mouse button is pressed, we start dragging */
	this.down = function(e) {
		parnt.lastPoint.x = e.pageX - e.target.offsetLeft;
		parnt.lastPoint.y = e.pageY - e.target.offsetTop;
		/* if we clicked on a dot, open commit in new window */
		if (parnt.canvas.drawDot) {
			var user = parnt.canvas.usersBySpace[parnt.canvas.drawDot.space - 1];
			window.open("http://github.com/"+user.name+"/"+user.repo+"/commit/"+parnt.canvas.drawDot.id);
		}
		/* if we clicked on a name, go to network for this person */
		if (parnt.lastPoint.x < parnt.canvas.names_width && parnt.lastPoint.y > 40) {
			for (var i = 0 ; i < parnt.canvas.dataManager.meta.blocks.length ; i++) {
				var val = parnt.canvas.dataManager.meta.blocks[i];
				var ystart = 80 + val.start * 20;
				var yend = ystart + val.count * 20;
				if ((ystart - parnt.canvas.yoffset <= parnt.lastPoint.y && yend - parnt.canvas.yoffset >= parnt.lastPoint.y)) {
					var user = parnt.canvas.dataManager.meta.users[i];
					document.location.href = "/"+user.name+"/"+user.repo+"/network";
				}
			}
		}
		parnt.dragging = true;
	};
	/* When the mouse button is released, we stop the dragging */
	this.up = function(e) {
		parnt.dragging = false;
	};
	/* When the mouse goes out of the canvas, we stop dragging */
	this.out = function(e) {
		parnt.dragging = false;
	};
	/* When the mouse cursor is moved, we either :
	 * - move the data displayed in the canvas left/up/down/right
	 *   if the button is pressed (dragging)
	 * - check if we are hovering a dot so we can display a hint */
	this.move = function(e) {
		var needRedraw = false;
		var end = 0;
		var x = e.pageX - e.target.offsetLeft;
		var y = e.pageY - e.target.offsetTop;
		/* Movement while the mouse button is pressed = scrolling */
		if (parnt.dragging) {
			var dx = x - parnt.lastPoint.x;
			var dy = y - parnt.lastPoint.y;
			/* limit left <-> right scrolling */
			parnt.canvas.xoffset -= dx;
			if (parnt.canvas.xoffset < parnt.canvas.names_width)
				parnt.canvas.xoffset = parnt.canvas.names_width;
			if (parnt.canvas.xoffset > parnt.canvas.maxx)
				parnt.canvas.xoffset = parnt.canvas.maxx;
			/* limit up <-> down scrolling */
			parnt.canvas.yoffset -= dy;
			if (parnt.canvas.yoffset > parnt.canvas.maxy)
				parnt.canvas.yoffset = parnt.canvas.maxy;
			if (parnt.canvas.yoffset < 40)
				parnt.canvas.yoffset = 40;

			needRedraw = true;
		} else {
			/* if we're not scrolling, check for mouseovers */
			/* check names (left column) mouseovers */
			if (x <= parnt.canvas.names_width && y > 40) {
				parnt.cursorOnNames = true;
				parnt.canvas.canvas.style.cursor = 'pointer';
				needRedraw = true;
			} else if (parnt.cursorOnNames == true) {
				parnt.cursorOnNames = false;
				needRedraw = true;
				parnt.canvas.canvas.style.cursor = 'default';
			}
			/* check dots mouseovers */
			var found = false;
			for (var i = 0 ; i < parnt.canvas.dotsMouseOver.length ; i++) {
				var val = parnt.canvas.dotsMouseOver[i];
				if (found == false) {
					if (Math.abs(val.x - x) <= 5) {
						if (Math.abs(val.y - y) <= 5) {
							found = val.val;
							break;
						}
					}
				}
			}
			if (parnt.canvas.drawDot != found) {
				/* Change the mouse so that we know we are on a link */
				if (found == false) {
					parnt.canvas.canvas.style.cursor ='default';
				} else {
					parnt.canvas.canvas.style.cursor ='pointer';
				}
				parnt.canvas.drawDot = found;
				needRedraw = true;
			}
		}
		if (needRedraw) {
			parnt.lastPoint.x = x;
			parnt.lastPoint.y = y;
			parnt.canvas.draw();
		}
	}
};

NetworkCanvas.Mouse.prototype = {
	init: function() {
		this.canvas.canvas.onmouseup = this.up;
		this.canvas.canvas.onmousedown = this.down;
		this.canvas.canvas.onmousemove = this.move;
		this.canvas.canvas.onmouseout = this.out;
	}
};

/******* Here starts the keyboard management mechanics *******/
NetworkCanvas.Keyboard = function(c) {
	this.canvas = c;
	var parnt = this;
	this.down = function(e) {
		var needRedraw = false;
		if (e.shiftKey) {
			switch(e.which) {
				case 72:	/* H */
				case 37:	/* <- */
					parnt.canvas.xoffset = 0;
					needRedraw = true;
					break;
				case 75:	/* K */
				case 38:	/* UP */
					parnt.canvas.yoffset = 0;
					needRedraw = true;
					break;
				case 76:	/* L */
				case 39:	/* -> */
					parnt.canvas.xoffset = parnt.canvas.maxx - (parnt.canvas.width - parnt.canvas.names_width);
					needRedraw = true;
					break;
				case 74:	/* J */
				case 40:	/* DOWN */
					parnt.canvas.yoffset = parnt.canvas.maxy;
					needRedraw = true;
					break;
			}
		} else {
			switch(e.which) {
				case 72:	/* H */
				case 37:	/* <- */
					parnt.canvas.xoffset -= 100;
					needRedraw = true;
					break;
				case 75:	/* K */
				case 38:	/* UP */
					parnt.canvas.yoffset -= 20;
					needRedraw = true;
					break;
				case 76:	/* L */
				case 39:	/* -> */
					parnt.canvas.xoffset += 100;
					needRedraw = true;
					break;
				case 74:	/* J */
				case 40:	/* DOWN */
					parnt.canvas.yoffset += 20;
					needRedraw = true;
					break;
				case 84:	/* T */
					parnt.canvas.drawLabels = !parnt.canvas.drawLabels;
					needRedraw = true;
					break;
			}
		}

		if (parnt.canvas.xoffset < parnt.canvas.names_width)
			parnt.canvas.xoffset = parnt.canvas.names_width;
		if (parnt.canvas.xoffset > parnt.canvas.maxx)
			parnt.canvas.xoffset = parnt.canvas.maxx;
		/* limit up <-> down scrolling */
		if (parnt.canvas.yoffset > parnt.canvas.maxy)
			parnt.canvas.yoffset = parnt.canvas.maxy;
		if (parnt.canvas.yoffset < 40)
			parnt.canvas.yoffset = 40;

		if (needRedraw) {
			parnt.canvas.draw();
		}
	};
};

NetworkCanvas.Keyboard.prototype = {
	init: function() {
		$(document).keydown(this.down);
	}
};

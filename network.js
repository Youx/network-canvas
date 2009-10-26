
/* used to transform a month number to a 3 character string */
var valtomonth = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
	"07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"};
var xoffset = 100;	/* the left column with names is 100 px wide */
var yoffset = 40;	/* the two month/day bars at the top take 40px */
var dotsMouseOver = [];	/* here we store the dots we can hover */
var avatars = {};	/* we store images loaded from gravatars in there */
var meta;		/* the metadata loaded from 'network_meta' file */
var data = [];		/* the data loaded from 'network_data?nethash=<hash>&start=<s>&end=<e> */
var heads = {};

var maxx = -920 + xoffset*2;
var maxy = -600 + yoffset*2 + 100; /* the +100 is just a margin in case we need to display HEADS */


function loadData() {
	$.getJSON("network_meta.php", function(data1) {
		meta = data1;
		parseMeta(meta);
		xoffset = 100 + meta.focus * 20;
		$.getJSON("network_data_chunk.php?nethash="+meta.nethash, function(data2) {
			parseData(data2);
			draw();
		});
	});
}

/* Compute the max width and height of the data inside the
 * canvas so we can block scrolling when going too far
 * We also put the HEADS in an associative array */
function parseMeta(meta) {
	/* each user can take 20px * X in height */
	for (var i = 0 ; i < meta.blocks.length ; i++) {
		maxy += 20 * meta.blocks[i].count;
	}
	/* each column takes 20px */
	maxx += (meta.dates.length * 20);
	/* parse the heads */
	for (var i = 0 ; i < meta.users.length ; i++) {
		var val = meta.users[i];
		if(!heads[val.name])
			heads[val.name] = {};
		for (var j = 0 ; j < val.heads.length ; j++) {
			var head = val.heads[j];
			if (!heads[val.name][head.id])
				heads[val.name][head.id] = []
			heads[val.name][head.id].push(head.name);
		};
	};
}

function parseData(d) {
	for (i = 0 ; i < d.commits.length ; i++) {
		var commit = d.commits[i];
		data[commit.time] = commit;
	}
}

var loading = false;
function getCommit(data, i) {
	/* if there is no */
	if (!data[i] && !loading && i < meta.dates.length) {
		loading = true;
		var start = Math.max(i - 100, 0);
		$.getJSON("network_data_chunk.php?nethash="+meta.nethash+"&start="+start+'&end='+(start+100), function(data2) {
			parseData(data2);
			loading = false;
			draw();
		});
	}
	return data[i];
}

/* The main draw function, it load the context from the canvas
 * and draws everything on it. It's called everytime we have
 * to update the graphics. */
function draw(){
	/* if the data is not loaded yet, draw nothing */
	if (!meta)
		return;
	if (!data)
		return;

	/* retreive the canvas */
	var canvas = $('#network-canvas').get(0);
	if (canvas.getContext){
		var ctx = canvas.getContext('2d');
		ctx.font = "small sans-serif";
		drawBlocks(ctx, meta, yoffset);
		/* draw the data points and arrows */
		drawData(ctx, data, xoffset, yoffset);
		/* draw the names on the left */
		drawNames(ctx, meta, yoffset);
		/* draw the month bar */
		drawMonthBar(ctx, meta);
		/* draw the day bar */
		drawDayBar(ctx, meta);
		/* draw the months/days in the two bars */
		drawDates(ctx, meta, xoffset);
		/* hide the first 100px of the months/days bars */
		ctx.fillStyle = "black";
		ctx.fillRect(0,0,100,20);
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillRect(0,20,100,20);
	}
}

/* Draw a 'hint' when a dot is mouse-hovered
 * It's basically a rectangle with smooth corners
 * a gravatar image + name + hash of the commit + comment */
function drawHint(ctx, hint, x, y) {
	/* draw the smoothed rectangle */
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.fillStyle = "white";
	ctx.lineWidth = "2";
	ctx.moveTo(x,y+5);
	ctx.quadraticCurveTo(x, y, x+5, y);
	ctx.lineTo(x + 395, y);
	ctx.quadraticCurveTo(x + 400, y, x + 400, y + 5);
	ctx.lineTo(x + 400, y + 95);
	ctx.quadraticCurveTo(x + 400, y + 100, x + 395, y + 100);
	ctx.lineTo(x + 5, y + 100);
	ctx.quadraticCurveTo(x, y + 100, x, y + 95);
	ctx.lineTo(x, y + 5);
	ctx.fill();
	ctx.stroke();
	/* Preload the avatar if it hasn't already been loaded */
	if (!avatars[hint.gravatar]) {
		avatars[hint.gravatar] = new Image();
		avatars[hint.gravatar].src = "http://www.gravatar.com/avatar/"+hint.gravatar+"?s=32";
		avatars[hint.gravatar].onload = function() {
			if (hint == drawDot)
				ctx.drawImage(avatars[hint.gravatar], x + 15, y + 15);
		};
	} else {
		ctx.drawImage(avatars[hint.gravatar], x + 15, y + 15);
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
	ctx.fillText(hint.message, x + 15, y + 80);
	done = 1;
}

/* Draw the black month bar at the top of the canvas */
function drawMonthBar(ctx, meta) {
	ctx.fillStyle = "black";
	ctx.fillRect(0,0,920,20);
}

/* Draw the grey day bar just under the month bar */
function drawDayBar(ctx, meta) {
	ctx.fillStyle = "rgb(64,64,64)";
	ctx.fillRect(0,20,920,20);
}

/* Draw the names of each repository owner in the left column */
function drawNames(ctx, meta, yoffset) {
	var colors = ["rgb(235,235,255)", "rgb(224,224,255)"];
	var y = 80;
	ctx.save();
	ctx.fillStyle = colors[0];
	ctx.fillRect(0, 40, 100, 600 - 40)
	for (var i = 0 ; i < meta.blocks.length ; i++) {
		val = meta.blocks[i];
		ydest = y + val.count * 20;
		if ( (y - yoffset >= 40 && y - yoffset <= 600) || (ydest - yoffset >= 40 && ydest - yoffset <= 600) ) {
			if (i%2 == 1) {
				ctx.fillStyle = colors[1];
				ctx.fillRect(0, y - yoffset, 100, val.count * 20);
			}
			ctx.strokeStyle = "rgb(222,222,222)";
			ctx.lineWidth = "1";
			ctx.beginPath();
			ctx.moveTo(100, y - yoffset + 0.5);
			ctx.lineTo(0.5, y - yoffset + 0.5);
			ctx.lineTo(0.5, y - yoffset + 0.5 + val.count * 20);
			ctx.lineTo(100, y - yoffset + 0.5 + val.count * 20);
			ctx.stroke();
			ctx.fillStyle = "black";
			ctx.fillText(val.name, 5, (y - yoffset) + (10 * val.count) + 5, 90);
		}
		y += val.count * 20;
	}
	ctx.restore();
}

/* Draw the to the right of each name in the right column */
function drawBlocks(ctx, meta, yoffset) {
	var colors = ["rgb(245,245,255)", "rgb(240,240,255)"];
	var y = 80;
	ctx.save();
	ctx.fillStyle = colors[0];
	ctx.fillRect(100, 40, 920 - 100, 600 - 40)
	for (var i = 0 ; i < meta.blocks.length ; i++) {
		val = meta.blocks[i];
		ydest = y + val.count * 20;
		if ( (y - yoffset >= 40 && y - yoffset <= 600) || (ydest - yoffset >= 40 && ydest - yoffset <= 600) ) {
			if (i%2 == 1) {
				ctx.fillStyle = colors[1];
				ctx.fillRect(100, y - yoffset, 820, val.count * 20);
			}
			ctx.lineWidth = "1";
			ctx.strokeStyle = "rgb(222,222,222)";
			ctx.strokeRect(0.5, y - yoffset + 0.5, 919.5, val.count * 20);
		}
		y += val.count * 20;
	}
	ctx.restore();
}

/* Draw the dates in the two bars at the top of the canvas
 * (month in the first bar and day in the second bar */
function drawDates(ctx, meta, xoffset) {
	var olddate;
	var newdate;
	var min = parseInt((xoffset - 100)/20);
	if (min <= 0)
		olddate = [1970,1,1];
	else
		olddate = meta.dates[min - 1].split("-");

	for (var i = parseInt((xoffset - 100)/20) ; i <= parseInt((xoffset - 100)/20 + 50) ; i++) {
		var val = meta.dates[i];
		if (!val)
			continue;
		newdate = val.split("-");
		var x = 200 + 20 * i - xoffset;
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
}

/* Draw a little branch head label under a dot */
function drawHead(ctx, label, x, y) {
	ctx.save();
	ctx.font = "10px monospace"
	var size = ctx.measureText(label).width;
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
}

/* we iterate of those colors when drawing branches... later we'll include more */
var branchColor = ["black", "red", "blue", "lawngreen", "magenta", "yellow", "orange", "cyan", "hotpink", "peru"];

function drawDataDots(ctx, data, xoffset, yoffset) {
	dotsMouseOver = [];
	/* Draw all the dots */
	for (var i = parseInt((xoffset - 100)/20) ; i <= parseInt((xoffset - 100)/20 + 50) ; i++) {
		var val = getCommit(data, i);
		if (!val)
			continue;
		var x = 200 + 20 * val.time - xoffset - 10;
		var y = 80 + 20 * val.space - yoffset - 10;
		/* draw the dot */
		if (x > 80 && x < 940 && y > 20 && y < 620) {
			ctx.beginPath();
			if (val == drawDot) {
				/* we are hovering a dot, draw it bigger
				 * and add a hint */
				ctx.fillStyle = "white";
				ctx.arc(x, y, 6, 0, (Math.PI * 2), false);
				ctx.fill();
				ctx.beginPath();
				ctx.fillStyle = branchColor[(val.space-1)%branchColor.length];
				ctx.arc(x, y, 5, 0, (Math.PI * 2), false);
				ctx.fill();
				drawHint(ctx, val, 200, 200);
			} else {
				/* only draw a small dot */
				ctx.fillStyle = branchColor[(val.space-1)%branchColor.length];
				ctx.arc(x, y, 3, 0, (Math.PI * 2), false);
				ctx.fill();
			}
			/* add the data to the array of dotsmouseover */
			dotsMouseOver.push({"x":x, "y": y, "val": val});
		}
	}
}

function drawDataHeads(ctx, data, xoffset, yoffset) {
	/* Draw all the HEADS */
	for (var i = parseInt((xoffset - 100)/20) ; i <= parseInt((xoffset - 100)/20 + 50) ; i++) {
		var val = getCommit(data, i);
		if (!val)
			continue;
		var x = 200 + 20 * val.time - xoffset - 10;
		var y = 80 + 20 * val.space - yoffset - 10;
		var yhead = y + 5;
		if (heads[val.login] && heads[val.login][val.id]) {
			for (var j = 0 ; j < heads[val.login][val.id].length ; j++) {
				var label = heads[val.login][val.id][j];
				yhead += drawHead(ctx, label, x, yhead) + 5;
			}
		}
	}
}

function drawDataLinks(ctx, data, xoffset, yoffset) {
	/* draw points */
	var displaycount = 0;
	//for (var i = parseInt((xoffset - 100)/20) ; i <= parseInt((xoffset - 100)/20 + 50) ; i++) {
	for (var i = data.length - 1; i >= parseInt((xoffset - 100)/20) ; i--) {
		var val = getCommit(data, i);
		if (!val)
			continue;
		var x = 200 + 20 * val.time - xoffset - 10;
		var y = 80 + 20 * val.space - yoffset - 10;
		ctx.strokeStyle = branchColor[(val.space-1)%branchColor.length];
		ctx.lineWidth = 2;
		/* for each dot, we ~may~ have to draw the line/arrow
		 * to its parent. */
		for (var j = 0 ; j < val.parents.length ; j++) {
			var parnt = val.parents[j];
			var xdest = 200 + 20 * parnt[1] - xoffset - 10;
			var ydest = 80 + 20 * parnt[2] - yoffset - 10;
			/* Check if the line can be seen */
			if (!needToDrawLine(x, y, xdest, ydest, 100, 40, 920, 600))
				continue;
			/* here we can draw different type of lines/arrows */
			if (parnt[2] == val.space) {
				/* the dots are on the same line,
				 * we only draw a line */
				ctx.beginPath();
				ctx.strokeStyle = branchColor[(val.space-1)%branchColor.length];
				ctx.moveTo(x - 5, y);
				ctx.lineTo(xdest + 5, y);
				ctx.stroke();
			} else if (parnt[2] > val.space) {
				/* the parent is > than the current
 				 * this will be a merge arrow */
				ctx.beginPath();
				ctx.lineWidth = 2;
				ctx.strokeStyle = branchColor[(parnt[2]-1)%branchColor.length];
				ctx.fillStyle = branchColor[(parnt[2]-1)%branchColor.length];
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
				ctx.beginPath();
				ctx.strokeStyle = branchColor[(val.space-1)%branchColor.length];
				ctx.fillStyle = branchColor[(val.space-1)%branchColor.length];
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
			}
		}
	}
}
/* Draw the dots and arrows / links in the canvas.
 * We may also draw a hint if a dot is hovered */
function drawData(ctx, data, xoffset, yoffset) {
	drawDataLinks(ctx, data, xoffset, yoffset);
	drawDataDots(ctx, data, xoffset, yoffset);
	drawDataHeads(ctx, data, xoffset, yoffset);
}

/* Calculate if we will need to draw an arrow (two segments)
 * in this canvas (the whole data is bigger than the canvas, so
 * we can't afford to draw everything, especially on big graphs) */
function needToDrawLine(xorig, yorig, xdest, ydest, xmin, ymin, xmax, ymax) {
	/* both dots are higher than the canvas, no need to draw */
	if (xorig < xmin && xdest < xmin)
		return false;
	/* both dots are lower than the canvas, no need to draw */
	if (xorig > xmax && xdest > xmax)
		return false;
	/* both dots are lefter than the canvas, no need to draw */
	if (yorig < ymin && ydest < ymin)
		return false;
	/* both dots are righter than the canvas, no need to draw */
	if (yorig > ymax && ydest > ymax)
		return false;
	/* those two are a bit trickier, but work */
	if ( (xorig < xmin || xorig > xmax) && (ydest < ymin || ydest > ymax) )
		return false;
	if ( (xdest < xmin || xdest > xmax) && (yorig < ymin || yorig > ymax) )
		return false;
	/* if we are here, we have to draw */
	return true;
}

/******* Here starts the mouse management mechanics *******/
var dragging = false;		/* is the mouse button pressed right now? */
var lastPoint = {"x":0, "y":0}; /* last coords of the mouse */
var drawDot = false;		/* the dot that we are hovering */

/* When the mouse button is released, we stop the dragging */
function mouseUp(e) {
	dragging = false;
}

/* When the mouse button is pressed, we start dragging */
function mouseDown(e) {
	lastPoint.x = e.pageX - e.target.offsetLeft;
	lastPoint.y = e.pageY - e.target.offsetTop;
	dragging = true;
}

/* When the mouse cursor is moved, we either :
 * - move the data displayed in the canvas left/up/down/right
 *   if the button is pressed (dragging)
 * - check if we are hovering a dot so we can display a hint */
function mouseMove(e) {
	var end = 0;
	var x = e.pageX - e.target.offsetLeft;
	var y = e.pageY - e.target.offsetTop;
	if (dragging) {
		var dx = x - lastPoint.x;
		var dy = y - lastPoint.y;
		/* cannot scroll beyond boundaries */
		xoffset -= dx;
		if (xoffset < 100)
			xoffset = 100;
		if (xoffset > maxx)
			xoffset = maxx;

		yoffset -= dy;
		if (yoffset < 40)
			yoffset = 40;
		if (yoffset > maxy)
			yoffset = maxy;

		lastPoint.x = x;
		lastPoint.y = y;
		draw();
	} else {
		var found = false;
		for (var i = 0 ; i < dotsMouseOver.length ; i++) {
			var val = dotsMouseOver[i];
			if (found == false) {
				if (Math.abs(val.x - x) <= 5) {
					if (Math.abs(val.y - y) <= 5) {
						found = val.val;
						break;
					}
				}
			}
		}
		if (drawDot != found) {
			/* Change the mouse so that we know we are on a link */
			if (found == false) {
				$('#network-canvas').get(0).style.cursor = 'default';
			} else {
				$('#network-canvas').get(0).style.cursor = 'hand';
			}
			drawDot = found;
			draw();
		}
	}
}

/* When the mouse goes out of the canvas, we stop dragging */
function mouseOut(e) {
	dragging = false;
}

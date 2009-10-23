
var valtomonth = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
	"07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"};
var branchColor = ["black", "red", "blue", "green", "magenta", "cyan"];
var xoffset = 100;
var yoffset = 40;
var dotsMouseOver = [];

var meta;
var data;

var maxx = -920 + xoffset*2;
var maxy = -600 + yoffset*2;
function parseMeta(meta) {
	$.each(meta.blocks, function(i, val) {
		maxy += 20 * val.count;
	});
	$.each(meta.dates, function(i, val) {
		maxx += 20;
	});
}
function draw(){
	if (!meta)
		return;
	if (!data)
		return;

	var canvas = document.getElementById('tutorial');
	if (canvas.getContext){
		var ctx = canvas.getContext('2d');
		drawData(ctx, data, xoffset, yoffset);
		drawNames(ctx, meta, yoffset);
		drawMonthBar(ctx, meta);
		drawDayBar(ctx, meta);
		drawDates(ctx, meta, xoffset);
		/* hide left month/day */
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillRect(0,0,100,20);
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillRect(0,20,100,20);
	}
}
function drawMonthBar(ctx, meta) {
	ctx.fillStyle = "rgb(0,0,0)";
	ctx.fillRect(0,0,920,20);
}
function drawDayBar(ctx, meta) {
	ctx.fillStyle = "rgb(64,64,64)";
	ctx.fillRect(0,20,920,20);
}
function drawNames(ctx, meta, yoffset) {
	var colors = ["rgb(235,235,255)", "rgb(224,224,255)"]
	var y = 80;
	$.each(meta.blocks, function(i, val) {
			ctx.fillStyle = colors[i%2];
			ctx.fillRect(0, y - yoffset, 100, val.count * 20);
			ctx.fillStyle = "black";
			ctx.fillText(val.name, 5, (y - yoffset) + (10 * val.count) + 5);
			y += val.count * 20;
	});
}
function drawDates(ctx, meta, xoffset) {
	var olddate = [1970,1,1];
	var newdate;
	$.each(meta.dates, function(i, val) {
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
	})
}
function drawData(ctx, data, xoffset, yoffset) {
	/* erase everything */
	ctx.fillStyle = "white";
	ctx.fillRect(100, 40, 920 - 100, 600 - 40);
	/* draw points */
	dotsMouseOver = [];
	$.each(data.commits, function(i, val) {
		var x = 200 + 20 * val.time - xoffset - 10;
		var y = 80 + 20 * val.space - yoffset - 10;
		/* draw point */
		ctx.strokeStyle = branchColor[(val.space-1)%6];
		ctx.lineWidth = 2;
		if (x > 80 && x < 940 && y > 20 && y < 620) {
			ctx.beginPath();
			ctx.fillStyle = branchColor[(val.space-1)%6];
			if (val == drawDot) {
				ctx.arc(x, y, 5, 0, 360, false);
			} else {
				ctx.arc(x, y, 3, 0, 360, false);
			}
			ctx.fill();
			/* add the data to the array of dotsmouseover */
			dotsMouseOver.push({"x":x, "y": y, "val": val});
		}
		$.each(val.parents, function(j, parnt) {
			var xdest = 200 + 20 * parnt[1] - xoffset - 10;
			var ydest = 80 + 20 * parnt[2] - yoffset - 10;
			if (!needToDrawLine(x, y, xdest, ydest, 100, 40, 920, 600))
				return;
			if (parnt[2] == val.space) {
				/* draw line */
				ctx.beginPath();
				ctx.moveTo(x - 5, y);
				ctx.lineTo(xdest + 5, y);
				ctx.stroke();
			} else if (parnt[2] > val.space) {
				/* the parent is > than the current
 				 * this will be a merge arrow */
				ctx.beginPath();
				ctx.strokeStyle = branchColor[(parnt[2]-1)%6];
				ctx.moveTo(xdest + 5, ydest);
				ctx.lineTo(x - 10, ydest);
				ctx.lineTo(x - 10, y + 12);
				ctx.lineTo(x - 5, y + 5);
				ctx.stroke();
			} else {
				/* fork arrow */
				ctx.beginPath();
				ctx.moveTo(x - 5, y);
				ctx.lineTo(200 + 20 * parnt[1] - xoffset - 10, y);
				ctx.lineTo(200 + 20 * parnt[1] - xoffset - 10, 80 + 20 * parnt[2] - yoffset - 10 + 5);
				ctx.stroke();
			}
		});
	});
}
function needToDrawLine(xorig, yorig, xdest, ydest, xmin, ymin, xmax, ymax) {
	if (xorig < xmin && xdest < xmin)
		return false;
	if (xorig > xmax && xdest > xmax)
		return false;
	if (yorig < ymin && ydest < ymin)
		return false;
	if (yorig > ymax && ydest > ymax)
		return false;
	if ( (xorig < xmin || xorig > xmax) && (ydest < ymin || ydest > ymax) )
		return false;
	if ( (xdest < xmin || xdest > xmax) && (yorig < ymin || yorig > ymax) )
		return false;
	return true;
}

var dragging = false;
var lastPoint = {"x":0, "y":0};
var drawDot;

function mouseUp(e) {
	dragging = false;
}
function mouseDown(e) {
	lastPoint.x = e.pageX - e.target.offsetLeft;
	lastPoint.y = e.pageY - e.target.offsetTop;
	dragging = true;
}
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
		$.each(dotsMouseOver, function(i, val) {
			if (found == false) {
				if (Math.abs(val.x - x) <= 5) {
					if (Math.abs(val.y - y) <= 5) {
						found = val.val;
					}
				}
			}
		});
		if (drawDot != found) {
			drawDot = found;
			draw();
		}
	}
}
function mouseOut(e) {
	dragging = false;
}

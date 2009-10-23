
/* used to transform a month number to a 3 character string */
var valtomonth = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
	"07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"};
/* we iterate of those colors when drawing branches... later we'll include more */
var branchColor = ["black", "red", "blue", "green", "magenta", "cyan"];
var xoffset = 100;	/* the left column with names is 100 px wide */
var yoffset = 40;	/* the two month/day bars at the top take 40px */
var dotsMouseOver = [];	/* here we store the dots we can hover */
var avatars = {};	/* we store images loaded from gravatars in there */
var meta;		/* the metadata loaded from 'network_meta' file */
var data;		/* the data loaded from 'network_data?nethash=<hash>&start=<s>&end=<e> */

var maxx = -920 + xoffset*2;
var maxy = -600 + yoffset*2;

/* Compute the max width and height of the data inside the
 * canvas so we can block scrolling when going too far */
function parseMeta(meta) {
	/* each user can take 20px * X in height */
	$.each(meta.blocks, function(i, val) {
		maxy += 20 * val.count;
	});
	/* each column takes 20px */
	maxx += (meta.dates.length * 20);
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
	var canvas = document.getElementById('tutorial');
	if (canvas.getContext){
		var ctx = canvas.getContext('2d');
		ctx.font = "small sans-serif";
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
	/* Preload the avatar if it hasn't already been loaded */
	if (!avatars[hint.gravatar]) {
		avatars[hint.gravatar] = new Image();
		avatars[hint.gravatar].src = "http://www.gravatar.com/avatar/"+hint.gravatar+"?s=32";
		avatars[hint.gravatar].onload = function() {
			ctx.drawImage(avatars[hint.gravatar], x + 15, y + 15);
		};
	} else {
		ctx.drawImage(avatars[hint.gravatar], x + 15, y + 15);
	}
	/* draw the smoothed rectangle */
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.moveTo(x,y+5);
	ctx.quadraticCurveTo(x, y, x+5, y);
	ctx.lineTo(x + 395, y);
	ctx.quadraticCurveTo(x + 400, y, x + 400, y + 5);
	ctx.lineTo(x + 400, y + 95);
	ctx.quadraticCurveTo(x + 400, y + 100, x + 395, y + 100);
	ctx.lineTo(x + 5, y + 100);
	ctx.quadraticCurveTo(x, y + 100, x, y + 95);
	ctx.lineTo(x, y + 5);
	ctx.stroke();
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
	/* add the avatar */
	//ctx.drawImage(avatars[hint.gravatar], x + 15, y + 15);
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

/* Draw the dates in the two bars at the top of the canvas
 * (month in the first bar and day in the second bar */
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

/* Draw the dots and arrows / links in the canvas.
 * We may also draw a hint if a dot is hovered */
function drawData(ctx, data, xoffset, yoffset) {
	/* erase everything */
	ctx.fillStyle = "white";
	ctx.fillRect(100, 40, 920 - 100, 600 - 40);
	/* draw points */
	dotsMouseOver = [];
	$.each(data.commits, function(i, val) {
		var x = 200 + 20 * val.time - xoffset - 10;
		var y = 80 + 20 * val.space - yoffset - 10;
		ctx.strokeStyle = branchColor[(val.space-1)%6];
		ctx.lineWidth = 2;
		/* draw the dot */
		if (x > 80 && x < 940 && y > 20 && y < 620) {
			ctx.beginPath();
			ctx.fillStyle = branchColor[(val.space-1)%6];
			if (val == drawDot) {
				/* we are hovering a dot, draw it bigger
				 * and add a hint */
				ctx.arc(x, y, 5, 0, (Math.PI * 2), false);
				ctx.fill();
				drawHint(ctx, val, 200, 200);
			} else {
				/* only draw a small dot */
				ctx.arc(x, y, 3, 0, (Math.PI * 2), false);
				ctx.fill();
			}
			/* add the data to the array of dotsmouseover */
			dotsMouseOver.push({"x":x, "y": y, "val": val});
		}
		/* for each dot, we ~may~ have to draw the line/arrow
		 * to its parent. */
		$.each(val.parents, function(j, parnt) {
			var xdest = 200 + 20 * parnt[1] - xoffset - 10;
			var ydest = 80 + 20 * parnt[2] - yoffset - 10;
			/* Check if the line can be seen */
			if (!needToDrawLine(x, y, xdest, ydest, 100, 40, 920, 600))
				return;
			/* here we can draw different type of lines/arrows */
			if (parnt[2] == val.space) {
				/* the dots are on the same line,
				 * we only draw a line */
				ctx.beginPath();
				ctx.strokeStyle = branchColor[(val.space-1)%6];
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
				/* the parent is < the current, this
				 * will be a fork arrow */
				ctx.beginPath();
				ctx.strokeStyle = branchColor[(val.space-1)%6];
				ctx.fillStyle = branchColor[(val.space-1)%6];
				/* draw arrowhead */
				ctx.lineWidth = 1;
				ctx.moveTo(x - 5, y);
				ctx.lineTo(x - 5 - 8, y - 2);
				//ctx.moveTo(x - 5, y);
				ctx.lineTo(x - 5 - 8, y + 2);
				ctx.lineTo(x - 5, y);
				ctx.fill();
				/* draw lines */
				ctx.lineWidth = 2;
				ctx.moveTo(x - 5 - 8, y);
				ctx.lineTo(xdest, y);
				ctx.lineTo(xdest, ydest + 5);
				ctx.stroke();
			}
		});
	});
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
			/* Change the mouse so that we know we are on a link */
			if (found == false) {
				document.getElementById('tutorial').style.cursor = 'default';
			} else {
				document.getElementById('tutorial').style.cursor = 'hand';
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


var valtomonth = {"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
	"07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"};
var xoffset = 100;
var yoffset = 40;

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
	var canvas = document.getElementById('tutorial');
	if (canvas.getContext){
		var ctx = canvas.getContext('2d');
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
			ctx.fillStyle = "rgb(0,0,0)";
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
			ctx.fillStyle = "rgb(255,255,255)";
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
var dragging = false;
var lastPoint = {"x":0, "y":0};
function mouseUp(e) {
	dragging = false;
}
function mouseDown(e) {
	lastPoint.x = e.pageX - e.target.offsetLeft;
	lastPoint.y = e.pageY - e.target.offsetTop;
	dragging = true;
}
function mouseMove(e) {
	if (dragging) {
		var x = e.pageX - e.target.offsetLeft;
		var y = e.pageY - e.target.offsetTop;
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
	}
}
function mouseOut(e) {
	dragging = false;
}

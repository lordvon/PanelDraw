function BasicCanvas()
{//assumes <body> exists.
	//private variables.
	var id = "flowfield";
	var width = 500;
	var height = 500;
	var styleString = "border:1px solid #000000;";
	var canvas,context;//to be initialized in the methods.
	var mouseDown = 0;//when mouse is held down.
	var lastpx=-1,lastpy=-1;

	//private methods.
	var getMousePos = function(evt)
	{
		var rect = canvas.getBoundingClientRect();
		var xval = evt.clientX - rect.left;
		var yval = evt.clientY - rect.top;
		return { x:xval, y:yval	};
	}
	var clearListener = function(evt)
	{
		var mousePos = getMousePos(evt);
		var px=(mousePos.x);
		var py=(height-mousePos.y);
		context.clearRect(0,0,width,height);
	}
	var drawPixel = function(px,py)
	{
		context.beginPath();
		context.moveTo(px, py);
		context.lineTo(px+1, py+1);
		context.stroke();
	}
	var pixelDrawListener = function(evt)
	{
		if(mouseDown > 0)
		{
			var mousePos = getMousePos(evt);
			var px=(mousePos.x);
			var py=(mousePos.y);
			drawPixel(px,py);
		}
	}
	var drawLine = function(px0,py0,px1,py1)
	{
		context.beginPath();
		context.moveTo(px0, py0);
		context.lineTo(px1, py1);
		context.stroke();
	}
	var lineDrawListener = function(evt)
	{
		if(mouseDown > 0)
		{
			var mousePos = getMousePos(evt);
			var px=mousePos.x;
			var py=mousePos.y;
			var notsame = (lastpx!==px) || (lastpy!==py);
			var notnew = lastpx>0 && lastpy>0;
			if(notsame && notnew)
			{
				drawLine(lastpx,lastpy,px,py);
			}
			lastpx = px;
			lastpy = py;
		}
	}
	var setMouseDown = function()
	{
		mouseDown = 1;
	}
	var clearMouseDown = function()
	{
		mouseDown = 0;
		lastpx = -1;
		lastpy = -1;
	}
	var initialize = function()
	{
		canvas = document.createElement("canvas");
		//add details to canvas.
		canvas.id = "flowfield";
		canvas.setAttribute("style",styleString);
		canvas.width = width;
		canvas.height = height;
		//get context.
		context = canvas.getContext("2d");
		//add mouse listeners.
		canvas.addEventListener('mousemove', lineDrawListener, false);
		canvas.addEventListener('mousedown', setMouseDown, false);
		canvas.addEventListener('mouseup', clearMouseDown, false);
	}
	//public methods.
	this.getContext = function()
	{
		return context;
	}
	this.addToBody = function()
	{
		//create and add to page.
		initialize();
		document.body.appendChild(canvas);
	}

}
SegmentCanvas.prototype = new BasicCanvas();
function SegmentCanvas()
{

}
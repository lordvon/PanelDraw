function PanelCanvas()
{//assumes <body> exists.
	//private variables.
	var id = "flowfield";
	var width = 700;
	var height = 400;
	var styleString = "border:1px solid #000000;";
	this.canvas = null;
	var context;//to be initialized in the methods.
	var mouseDown = 0;//when mouse is held down.
	var lastpx=-1,lastpy=-1;
	var drawNew = 1;
	var threshold = 10;//maximum segment length.
	var elements = [];//last element 
	var tePanels = [];//panel indices for each element whose first point is a trailing edge.
	var currentElement = -1;//index of elements.
	var drawNewElement = 1;
	var lastPoint = null;
	var controlPanel,elementsList,statusDiv
	//var loadDiv;
	var closedElement;

	var solution;


	//physical constants.
	var BASEDIM = 5;//a scaling factor for the pixels.


	//private methods.
	var getMousePos = function(evt)
	{
		var rect = canvas.getBoundingClientRect();
		var xval = evt.clientX - rect.left;
		var yval = evt.clientY - rect.top;
		return { x:xval, y:yval	};
	};
	var clearListener = function(evt)
	{
		var mousePos = getMousePos(evt);
		var px=(mousePos.x);
		var py=(height-mousePos.y);
		context.clearRect(0,0,width,height);
	};
	var drawPixel = function(px,py)
	{
		context.beginPath();
		context.moveTo(px, py);
		context.lineTo(px+1, py+1);
		context.stroke();
	};
	var pixelDrawListener = function(evt)
	{
		if(mouseDown > 0)
		{
			var mousePos = getMousePos(evt);
			var px=(mousePos.x);
			var py=(mousePos.y);
			drawPixel(px,py);
		}
	};
	var drawLine = function(px0,py0,px1,py1)
	{
		context.beginPath();
		context.moveTo(px0, py0);
		context.lineTo(px1, py1);
		context.stroke();
	};
	var clearMouseDown = function()
	{
		mouseDown = 0;
		lastpx = -1;
		lastpy = -1;
	};
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
	};
	var segmentDrawListener = function(evt)
	{
		if(mouseDown > 0)
		{
			var mousePos = getMousePos(evt);
			var px=mousePos.x;
			var py=mousePos.y;
			if(drawNew<1)
			{
				var dx = px-lastpx;
				var dy = py-lastpy;
				var distanceFromLast = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
				var farenough = distanceFromLast >= threshold;
				if(farenough)
				{
					drawLine(lastpx,lastpy,px,py);
					lastpx = px;
					lastpy = py;
				}
			}
			else
			{
				lastpx = px;
				lastpy = py;
				drawNew = 0;
			}
		}
	};
	var drawFilledCircle = function(point)
	{
		context.beginPath();
		context.arc(point.px,point.py,2,0,2*Math.PI);
		context.stroke();
	};
	var drawTE = function(point)
	{	context.fillStyle = "rgb(255,0,0,1)";
		context.beginPath();
		context.arc(point.px,point.py,2,0,2*Math.PI);
		context.stroke();
	};
	var drawLineFromPoints = function(point0,point1)
	{
		context.beginPath();
		context.moveTo(point0.px, point0.py);
		context.lineTo(point1.px, point1.py);
		context.stroke();
	};
	var prepareNewElement = function()
	{
		drawNewElement = 0;
		currentElement = elements.length;
		elements.push([]);
		//console.log(elements.length);
	}
	var resetElement = function()
	{
		drawNewElement = 1;
		mouseDown = 0;
	}
	var panelDrawListener = function(evt)
	{
		var proximityThreshold = 5;//for closing the element.
		var minimumPanelsPerElement =  5;
		if(mouseDown > 0)
		{
			var mousePos = getMousePos(evt);
			var px=mousePos.x;
			var py=mousePos.y;
			if(drawNewElement<1)
			{
				var newPoint = new Point(px,py);
				if(elements[currentElement].length >= minimumPanelsPerElement)
				{
					var startPoint = elements[currentElement][0].startPoint;
					var distanceFromStart = newPoint.getDistance(startPoint);
					if(distanceFromStart<=proximityThreshold)
					{
						var newPanel = new Panel(lastPoint,startPoint,distanceFromStart);
						elements[currentElement].push(newPanel);
						drawLineFromPoints(lastPoint,startPoint);
						resetElement();
						//console.log("resetElement triggered");
						return;
					}
				}
				
				{
					var distanceFromLast = newPoint.getDistance(lastPoint);
					var farenough = distanceFromLast >= threshold;
					if(farenough){
						var newPanel = new Panel(lastPoint,newPoint,distanceFromLast);
						elements[currentElement].push(newPanel);
						drawLineFromPoints(lastPoint,newPoint);
						drawFilledCircle(newPoint);
						lastPoint = newPoint;
					}
				}
			}
			else
			{
				lastPoint = new Point(px,py);
				//console.log(px+" "+py);
				drawFilledCircle(lastPoint);
				prepareNewElement();
			}
			
			
		}
	};
	var panelDrawMouseUp = function()
	{
		mouseDown=0;
		drawNew=1;
		drawNewElement=1;
		updateElementsList();
		//if(closedElement==0)
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
		canvas.addEventListener('mousemove', panelDrawListener, false);
		canvas.addEventListener('mousedown', function(){ mouseDown=1;closedElement=0; }, false);
		canvas.addEventListener('mouseup', panelDrawMouseUp, false);
	}



	//Function for drawing panels and elements.
	this.drawPanels = function(panels,canvas)
	{//
		for(var i=0;i<panels.length;++i)
		{
			var startPoint = panels[i].startPoint;
			var endPoint = panels[i].endPoint;
			drawFilledCircle(startPoint);
			drawLine(startPoint.px,startPoint.py,endPoint.px,endPoint.py);
		}
	}

	var redraw = function()
	{
		context.clearRect(0,0,canvas.width,canvas.height);
		for(var i = 0;i<elements.length;++i)
		{
			var startPoint = elements[i][0].startPoint;
			drawTE(startPoint);
			var endPoint = elements[i][0].endPoint;
			drawLineFromPoints(startPoint,endPoint);
			for(var j =1;j<elements[i].length;++j)
			{
				startPoint = elements[i][j].startPoint;
				drawFilledCircle(startPoint);
				endPoint = elements[i][j].endPoint;
				drawLineFromPoints(startPoint,endPoint);
			}
		}
	}
	//Control panel for panels and elements.
	function deleteLastElement()
	{
		elements.pop();
		tePanels.pop();
		currentElement = elements.length-1; 
	}
	var deleteLastElementListener = function()
	{
		deleteLastElement();
		redraw();
		updateElementsList();
	}
	var createControlPanelButton = function(id,text,listener)
	{
		var newButton = document.createElement("button");
		newButton.id = id;
		newButton.innerHTML = text;
		newButton.addEventListener("click",listener,false);
		controlPanel.appendChild(newButton);
	}
	function updateElementsList()
	{
		elementsList.innerHTML = '';
		for(var i=0;i<elements.length;++i)
		{
			var newItem = document.createElement("li");
			newItem.innerHTML = "Element "+i+" ("+elements[i].length+" panels)";
			elementsList.appendChild(newItem);
		}
	}
	var solveListener = function()
	{
		//console.log("Number of elements at solver call: "+elements.length);
		if(elements.length>0)
		{
			statusDiv.innerHTML = "Solving...";
			system = new LinearSystem(elements);
			//solution = system.x;
			statusDiv.innerHTML = "Done! ";
			//console.log("System totals: "+system.totalcl+", "+system.totalcd);
			//statusDiv.innerHTML += "CL: "+(0.00+system.totalcl)+", CD: "+(0.00+system.totalcd);
			//console.log(system.getCl())
			statusDiv.innerHTML += "CL: "+system.getCl()+", CD: "+system.getCd();
		}
		else
		{
			statusDiv.innerHTML = "No elements to compute on.";
		}
	}
	//var loadListener = function()
	//{
	//	loadDiv.innerHTML = "Loading file...";



	//	loadDiv.innerHTML = "Done!";
	//}
	var initializeControlPanel = function()
	{
		controlPanel = document.createElement("div");
		createControlPanelButton("deleteLastElement","Delete Last Element",deleteLastElementListener);
		createControlPanelButton("solve","Solve",solveListener);
		statusDiv = document.createElement("div");
		controlPanel.appendChild(statusDiv);
		elementsList = document.createElement("ol");
		controlPanel.appendChild(elementsList);
		//loadDiv = document.createElement("div");
		//document.createElement("input");
		//input.type = "text"
		//createControlPanelButton("load","Load",loadListener);
		//controlPanel.appendChild(loadDiv);
	}

	var initializeTestCase = function()
	{
		var newElement = [];
		var cx = width/2;
		var cy = height/2;
		var le = new Point(cx,cy);
		var u2 = new Point(cx+20,cy-10);
		var u3 = new Point(cx+60,cy-10);
		var u4 = new Point(cx+80,cy-5);
		var te = new Point(cx+100,cy);

		var l2 = new Point(cx+20,cy+10);
		var l3 = new Point(cx+60,cy+10);
		var l4 = new Point(cx+80,cy+5);

		var p1 = new Panel(te,l4,te.getDistance(l4));
		var p2 = new Panel(l4,l3,l4.getDistance(l3));
		var p3 = new Panel(l3,l2,l3.getDistance(l2));
		var p4 = new Panel(l2,le,l2.getDistance(le));
		var p5 = new Panel(le,u2,le.getDistance(u2));
		var p6 = new Panel(u2,u3,u2.getDistance(u3));
		var p7 = new Panel(u3,u4,u3.getDistance(u4));
		var p8 = new Panel(u4,te,u4.getDistance(te));

		elements.push([]);
		elements[0] = [p1,p2,p3,p4,p5,p6,p7,p8];
		//console.log(elements.length);
		//console.log(elements[0]);
		redraw();
		updateElementsList();

	};
















	//public methods.
	this.getContext = function()
	{
		return context;
	};
	this.addToBody = function()
	{
		//create and add to page.
		initialize();
		document.body.appendChild(canvas);
	};
	this.addToContainer = function(containerId)
	{
		//create and add to page.
		initialize();
		document.getElementById(containerId).appendChild(canvas);
		initializeControlPanel();
		document.getElementById(containerId).appendChild(controlPanel);
		initializeTestCase();
	};



	//Post-processing
	var getRed = function(normalizedValue)
	{
		//normalizedValue is between 0 and 1, inclusive.
		var red=0;
		if(normalizedValue<0.5){
			if(normalizedValue>=0.25){
				red=1-(normalizedValue-0.25)*4;
			}
			else if(normalizedValue>=0){
				red=1;
			}
		}
		return parseInt(red*255);
	}
	var getGreen = function(normalizedValue)
	{
		//normalizedValue is between 0 and 1, inclusive.
		var green=0;
		if(normalizedValue>=0.75){
			green=1-(normalizedValue-0.75)*4;
		}
		else if(normalizedValue>=0.5){
			green=1;
		}
		else if(normalizedValue>=0.25){
			green=1;
		}
		else if(normalizedValue>=0){
			green=normalizedValue*4;
		}
		return parseInt(green*255);
	}
	var getBlue = function(normalizedValue)
	{
		//normalizedValue is between 0 and 1, inclusive.
		var blue=0;
		if(normalizedValue>=0.75){
			blue=1;
		}
		else if(normalizedValue>=0.5){
			blue=(normalizedValue-0.5)*4;
		}
		return parseInt(blue*255);
	}

	this.phiColor = function(phi,imax,jmax,maxPhi,minPhi)
	{//assumed globals: imax,jmax,phi,context
		//getPhiExtremes();
		
		for (var j=0;j<jmax-1;j++) {
			for (var i=0;i<imax-1;i++) {
				var pi=padding+i/(imax-1)*pimax;
				var nextpi=padding+(i+1)/(imax-1)*pimax;
				var pj=padding+j/(jmax-1)*pjmax;
				var nextpj=padding+(j+1)/(jmax-1)*pjmax;

				var ii=parseInt(i)+parseInt(j*imax);
				var v0=phi[ii];
				var v1=phi[ii+1];
				var v2=phi[parseInt(ii)+1+parseInt(imax)];
				var v3=phi[parseInt(ii)+parseInt(imax)];
				//window.alert("v0: "+v0+", v1: "+v1+", v2: "+v2+", v3: "+v3);
				var average = (v0+v1+v2+v3)/4;
				//window.alert(average);
				var fraction=0;
				if(maxPhi-minPhi != 0){
					fraction=(average-minPhi)/(maxPhi-minPhi);
				}
				//window.alert(getRed(fraction)+", "+getGreen(fraction)+", "+getBlue(fraction));
				context.fillStyle = "rgba("+
					getRed(fraction)+","+
					getGreen(fraction)+","+
					getBlue(fraction)+","+
					(1)+")";
				var bw=nextpi-pi+1;
				var bh=nextpj-pj+1;
				//window.alert(parseInt(pi)+", "+(parseInt(pjmax)+parseInt(padding)-pj)+", "+bw+", "+bh);
				context.fillRect( pi, parseInt(pjmax)+parseInt(padding)-pj, 
						bw, bh );
			}
		}
	}
}

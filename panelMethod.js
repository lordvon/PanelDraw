function Point(px,py)
{
	this.px = px;
	this.py = py;
	this.getDistance = function(point)
	{
		var dpx = this.px-point.px;
		var dpy = this.py-point.py;
		return Math.sqrt(Math.pow(dpx,2)+Math.pow(dpy,2));
	}
	this.getMidpoint = function(point)
	{
		var midpx = (this.px+point.px)/2.0;
		var midpy = (this.py+point.py)/2.0;
		var point = new Point(midpx,midpy);
		return point;
	}
	this.getDpx = function(point)
	{///gets the x pixel distance distance between the current point and 'point'.
		return point.px-this.px; 
	}
	this.getDpy = function(point)
	{
		return -(point.py-this.py);
	}
}
function Panel(p1,p2)
{
	var start = p1;
	var end = p1;
	var center = start.getMidpoint(end);
	var length = start.getDistance(end);
	var strength = 0;
}
function Panel(p1,p2,panelLength)
{
	this.startPoint = p1;
	this.endPoint = p2;
	this.centerPoint = this.startPoint.getMidpoint(this.endPoint);
	this.panelLength = panelLength;
	//this.panelLength = p1.getDistance(p2);//chordpx;
	this.dpx = (this.endPoint.px-this.startPoint.px);//chordpx;
	this.dpy = -(this.endPoint.py-this.startPoint.py);//chordpx;
	this.normalize = function(chordpx)
	{
		//chord length in pixels.
		this.panelLength/=chordpx;
		this.dpx/=chordpx;
		this.dpy/=chordpx;
	}
}
function ClosedElement()
{
	var panels = [];//array of panels. 
	var tePanels = -[];//indices of 2 panels that comprise the trailing edge.

}
function Element(panels,rgb)
{//Describes a collection of panels describing one body.
	var color = "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",1)";
	this.panels = panels;
}

function LinearSystem(elements)
{//Ax = b.
	//The matrix is constructed in order of elements. 
	//The total circulation for each element is stored after all of the panels have been stored.
	var A = [];//matrix.
	var b = [];
	this.x = [];
	this.cl = [];
	this.cd = [];
	this.cm = [];
	this.chordpx = 0;
	this.normc = 0;//the inverse of chordpx, to to multiplications instead of divisions.
	this.totalcl = 0;
	this.totalcd = 0;
	this.totalcm = 0; 
	var output = [];
	var ne = elements.length;
	var allPanels = 0;
	for(var i=0;i<ne;++i)
	{
		allPanels+=elements[i].length;
	}
	var dimA = allPanels+ne;

	var AOA = 0*Math.PI*180;//angle of attack in radians.

	var fillElementTotalCirculation = function()
	{//Fills entries in A for the total circulation 
		//for every element.
		for(var j = allPanels;j<dimA;j+=1)
		{
			for(var i=0;i<allPanels;++i)
			{
				A[i][j] = 1.0;
			}
		}
	}
	var applyKuttaCondition = function()
	{//applies Kutta condition for the matrix A.
		//occurs at the very end of the matrix (row-wise).
		//All panels are filled first.
		var currentStart = 0;
		for(var i=0;i<ne;++i)
		{
			var cr = allPanels+i;//current row in matrix A.
			A[cr][currentStart] = 1.0;
			var np = elements[i].length;//number of panels in current element.
			A[cr][currentStart+np-1] = 1.0;
			currentStart+=np;
		}
	}
	var initializeToZero = function()
	{
		//console.log(dimA);
		for(var i=0;i<dimA;++i)
		{
			b[i] = 0.0;
			var current = [];
			for(var j=0;j<dimA;++j)
			{
				current[j] = 0.0;
				//A[i][j] = 0.0;
			}
			A.push(current);
			//if(i==dimA-2) console.log("row "+i+": "+A[i]);
		}
	}
	var fillRHS = function()
	{
		var currentStart = 0;
		//console.log("Printing b:");
		for(var e=0;e<elements.length;++e)
		{
			for(var p=0;p<elements[e].length;++p)
			{
				var center = elements[e][p].centerPoint;
				var adjpy = canvas.height-center.py;
				b[currentStart+p] = (adjpy*Math.cos(AOA)
					-center.px*Math.sin(AOA))*this.normc;
				//console.log("b["++"]");
			}
			currentStart+=elements[e].length;
		}
	}
	var detectNaN = function(number)
	{
		if(isNaN(number))
			console.log("NaN Detected!");
	}
	var fillInfluenceCoefficients = function()
	{
		var currentStart = 0;
		for(var e=0;e<elements.length;++e)
		{
			var np = elements[e].length;
			//console.log(np);
			for(var j=0;j<np;++j)
			{
				for(var i=0;i<np;++i)
				{
					var ipanel = elements[e][i];
					var ds = ipanel.panelLength;//this.chordpx;
					//console.log()
					if(i==j)
					{
						A[i][i] = ds/(2*Math.PI)*(Math.log(0.5*ds)-1.0);						
					}
					else
					{
						var jc = elements[e][j].centerPoint;
						//normalized i-deltas
						var nidx = ipanel.dpx/ds;
						var nidy = ipanel.dpy/ds;
						var ip0 = ipanel.startPoint;//start point of ipanel.
						var jctoip0_dx = jc.getDpx(ip0)*this.normc;
						var jctoip0_dy = jc.getDpy(ip0)*this.normc;
						var ip1 = ipanel.endPoint;//end point of ipanel.
						var jctoip1_dx = jc.getDpx(ip1)*this.normc;
						var jctoip1_dy = jc.getDpy(ip1)*this.normc;
						//distance quantities.
						var d1 = jctoip0_dx*nidx + jctoip0_dy*nidy;
						var d2 = jctoip1_dx*nidx + jctoip1_dy*nidy;
						var d3 = jctoip0_dy*nidx - jctoip0_dx*nidy;
						//detectNaN(ds);
						var t1 = d2*Math.log(d2*d2+d3*d3) - d1*Math.log(d1*d1+d3*d3);
						var t2 = Math.atan2(d3,d1) - Math.atan2(d3,d2);
						
						A[j][i] = (0.5*jctoip0_dx-d2+d1+d3*jctoip0_dy)/(2*Math.PI);
						//detectNaN(A[i][j]);
					}
					//console.log("Filled row "+i+" (max: "+(np-1)+")");
					//if(i==np-1)
					//	console.log("Entry "+(i)+","+j+": "+A[i][j]);
				}
			}
		}
	}
	var solveSystem = function()
	{
		//for(var i=0;i<dimA;++i)	{ console.log("row "+i+": "+A[i]); }
		//console.log(b);
		this.x = numeric.solve(A,b);
	}
	var getChord = function()
	{
		//simply returns maximum x minus minimum x.
		var minx = elements[0][0].startPoint.px;
		var maxx = elements[0][0].startPoint.py;
		for(var e=0;e<elements.length;++e)
		{
			for(var p=0;p<elements[e].length;++p)
			{
				var sp = elements[e][p].startPoint;
				var ep = elements[e][p].endPoint;
				if(sp.px < minx)
				{
					minx = sp.px;
				}
				if(ep.px < minx)
				{
					minx = ep.px;
				}
				if(sp.px > maxx)
				{
					maxx = sp.px;
				}
				if(ep.px > maxx)
				{
					maxx = ep.px;
				}
			}
		}
		this.chordpx = maxx - minx;
		this.normc = 1/this.chordpx;
		console.log("Chord in pixels: "+this.chordpx);
		//apply nomralization to all panels
		for(var e=0;e<elements.length;++e)
		{
			for(var p=0;p<elements[e].length;++p)
			{
				elements[e][p].normalize(this.chordpx);
			}
		}
	}
	function extractPerformanceMetrics()
	{
		var totalcx = 0;
		var totalcy = 0;
		var currentStart = 0;
		console.log("Printing Circulation Strength: ");
		console.log(x);
		for(var e=0;e<elements.length;++e)
		{
			console.log("Element "+e+", "+elements[e].length+" panels");
			for(var p=0;p<elements[e].length;++p)
			{
				var gi = currentStart+p;
				var cp = 1.0 - x[gi]*x[gi];
				var dy = elements[e][p].dpy;//this.chordpx;
				var dx = elements[e][p].dpx;//this.chordpx;
				var incx = cp*dy;
				var incy = cp*dx;
				totalcx += incx;
				totalcy -= incy;
				//if(incx===0 || incx===0) {	console.log("Zero increment detected! ("+incx+","+incy+")"); }
				//if(cp!=0) { alert("Hit! (cp="+(cp)+")"); }
			}
			currentStart+=elements[e].length;
		}
		this.totalcl = totalcy*Math.cos(AOA) - totalcx*Math.sin(AOA);
		this.totalcd = totalcy*Math.sin(AOA) + totalcx*Math.cos(AOA);
		//console.log("System totals 1: "+this.totalcl+", "+this.totalcd);
		output.push(this.totalcd);
		output.push(this.totalcl);
	}

	//alert("Starting the solver...");
	initializeToZero();
	getChord();
	//alert("Filling the matrix ("+A.length+" x "+A[A.length-1].length+")...");
	fillElementTotalCirculation();
	fillInfluenceCoefficients();
	applyKuttaCondition();
	//alert("Filling the RHS...");
	fillRHS();
	//alert("Calling the linear system solver...");
	solveSystem();
	//alert("Done!");
	extractPerformanceMetrics();
	//console.log("System totals 2: "+this.totalcl+", "+this.totalcd);
	return output;
}

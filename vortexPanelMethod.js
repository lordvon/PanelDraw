function Point(x,y)
{
	this.x = x;
	this.y = y;
	this.getDistance = function(point)
	{
		var dx = this.x-point.x;
		var dy = this.y-point.y;
		return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));
	}
	this.getMidpoint = function(point)
	{
		var midx = (this.x+point.x)/2.0;
		var midy = (this.y+point.y)/2.0;
		var point = new Point(midx,midy);
		return point;
	}
}
function Panel(p1,p2)
{
	this.centerPoint = p1.getMidpoint(p2);
	this.segmentLength = p1.getDistance(p2);
	this.strength = 0;
}

var influenceCoefficient = function(panel1,panel2)
{
	return 0.5/Math.PI*Math.log(panel1);
}
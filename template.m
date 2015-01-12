%  Panel Code in MATLAB
%  Coded by L. sankar, April 1997
%  Open a File and read airfoil coordinates
clear; clc;
%fid = fopen('test.txt','r');
fid = fopen('panel.data.txt','r')
% Read Angle of Attack
alpha = fscanf(fid,'%f',1);
% read number of points on the upper side of airfoil
nu = fscanf(fid,'%d',1);
% read number of points on the lower side of airfoil
nl = fscanf(fid, '%d',1);
% read Flag that states if this airfoil is symmetric
% if isym > 0 then airfoil is assumed symmetric
isym = fscanf(fid,'%d',1);
% Read a scaling factor
% The airfoil y- ordinates will be multiplied by this factor
factor=fscanf(fid,'%f',1);

if(isym>0)
  nl = nu;
end
% Allocate storage for x and y
x = zeros(1,100);
y = zeros(1,100);
% Read the points on the upper surface
for i = nl:nl+nu-1
   a=fscanf(fid,'%f',1);
   b = fscanf(fid,'%f',1);
   x(i) = a;
   y(i) = b * factor;
end
if isym == 0 
% If the airfoil is not symmetric, read lower side ordinates too..
    for i = 1:nl
      a=fscanf(fid, '%f',1);
      b = fscanf(fid, '%f', 1);
      x(nl+1-i) = a;
      y(nl+1-i) = b * factor;
    end
else

    for i =1:nl 
       x(nl+1-i) = x(nl-1+i);
       y(nl+1-i) = - y(nl-1+i);
    end
end
fclose(fid);
% Plot the airfoil on window #1
% title('Airfoil');
plot(x,y);
n=nu+nl-2;
A=zeros(n+1,n+1);
ds=zeros(1,n);
pi=4. * atan(1.0);
% Assemble the Influence Coefficient Matrix A
 for i = 1:n
   t1= x(i+1)-x(i);
   t2 = y(i+1)-y(i);
   ds(i) = sqrt(t1*t1+t2*t2);
 end
for j = 1:n
 a(j,n+1) = 1.0;
 for i = 1:n
   if i == j
     a(i,i) = ds(i)/(2.*pi) *(log(0.5*ds(i)) - 1.0);
   else
     %midpoints of panel
     xm1 = 0.5 * (x(j)+x(j+1));
     ym1 = 0.5 * (y(j)+y(j+1));
     %ordinate/abscissa delta, normalized by total panel length.
     dx  = (x(i+1)-x(i))/ds(i);
     dy  = (y(i+1)-y(i))/ds(i);
     %distance from panel midpoint to start point
     t1  = x(i) - xm1;
     t2  = y(i) - ym1;
     %distance from panel midpoint to end point
     t3  = x(i+1) - xm1;
     t7  = y(i+1) - ym1;
     %???
     t4  = t1 * dx + t2 * dy;
     t5  = t3 * dx + t7 * dy;
     t6  = t2 * dx - t1 * dy;
     
     t10=t1;
     t20=t2;
     t1  = t5 * log(t5*t5+t6*t6) - t4 * log(t4*t4+t6*t6);
     t2  = atan2(t6,t4)-atan2(t6,t5);
     a(j,i) = (0.5 * t1-t5+t4+t6*t2)/(2.*pi);
     if j==1 && i==2
         disp(['dx: ' num2str(dx)])
         disp(['dy: ' num2str(dy)])
         disp(['t10: ' num2str(t10)])
         disp(['t20: ' num2str(t20)])
         disp(['t3: ' num2str(t3)])
         disp(['t7: ' num2str(t7)])
         disp(['t4: ' num2str(t4)])
         disp(['t5: ' num2str(t5)])
         disp(['t6: ' num2str(t6)])
         disp(['t1: ' num2str(t1)])
         disp(['t2: ' num2str(t2)])
         disp(['a(j,i): ' num2str(a(j,i))])
     end
   end
 end
%Kutta Condition!
a(n+1,1) = 1.0;
a(n+1,n) = 1.0;
end
% Assemble the Right hand Side of the Matrix system
rhs=zeros(n+1,1);
alpha = alpha * pi /180;
xmid=zeros(n,1);
for i = 1:n
  xmid(i,1) = 0.5 * (x(i) + x(i+1));
  ymid = 0.5 * (y(i) + y(i+1));
  rhs(i,1) = ymid * cos(alpha) - xmid(i) * sin(alpha);
end
gamma = zeros(n+1,1);
% Solve the syetm of equations
% In MATLAB this is easy!
a
rhs
%x'
%y'
%ds'
gamma = a\rhs;
cp=zeros(n,1);
cp1=zeros(n,1);
% Open a file to write x vs. Cp and the Loads
% Change the file name below, to open a new file every time 
fid=fopen('cp4.dat','w');
fprintf(fid,'   X          CP\n\n');
for i = 1:n
cp(i,1) = 1. - gamma(i) * gamma(i);
cp1(i,1) = - cp(i,1);
xa    = xmid(i,1);
cpa = cp(i,1);
% Write x and Cp to the file
% The xa- coordinate is the center points of panel 'i'
% Cpa is the Cp value at that point
fprintf(fid,'%10.4f %10.4f\n',xa,cpa);
end
% Open a new figure and plot x vs. Cp
figure(2);
plot(xmid,cp1);
% Compute Lift and Drag Coefficients
cy = 0.0;
cx = 0.0;
cm = 0.0;
% We assume that the airfoil has unit chord
% we assume that the leading edge is at i = nl;
for i=1:n
dx = x(i+1) - x(i);
dy = y(i+1) - y(i);
% xarm is the moment arem , equals distance from
% the center of the panel to quarter-chord.
xarm = 0.5 * (x(i+1)+x(i))-x(nl)-0.25;
cy = cy - cp(i,1) * dx;
cx = cx + cp(i,1) * dy;
cm = cm - cp(i,1) * dx * xarm;
end
% Print Lift and Drag coefficients on the screen
cl = cy * cos(alpha) - cx * sin(alpha)
cd = cy * sin(alpha) + cx * cos(alpha)
cm
% Write lift and Drag coefficients to a file
fprintf(fid,'  CL        CD  CM\n');
fprintf(fid,'%10.4f %10.4f %10.4f\n', cl,cd,cm);
fclose(fid);
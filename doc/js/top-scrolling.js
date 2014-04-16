/* Functions to manage the transition of the Top label */
function getScrollingPosition() {
	var position = [0, 0];
	if (typeof window.pageYOffset != 'undefined') {
		position = [window.pageXOffset, window.pageYOffset];
	}
	else if (typeof document.documentElement.scrollTop	!= 'undefined' && document.documentElement.scrollTop > 0)	{
		position = [document.documentElement.scrollLeft, document.documentElement.scrollTop];
	}
	else if (typeof document.body.scrollTop != 'undefined')	{
		position = [document.body.scrollLeft, document.body.scrollTop];
	}
	return position;
}

window.onscroll = function () {
	var scrollpos = getScrollingPosition();
	var scrollMenu = document.getElementById("scrollMenu");
	
	if (scrollMenu != null) {					
		if (scrollpos[1] > 910) {							
			scrollMenu.setAttribute("class", "down");							
			trStarted = true;
		} else {														
			scrollMenu.setAttribute("class", "up");
		}					
	}			
}

/* Functions to manage the smooth scrool from the bottom to the top of the page */
function currentYPosition() {
	// Firefox, Chrome, Opera, Safari
	if (self.pageYOffset) return self.pageYOffset;
	// Internet Explorer 6 - standards mode
	if (document.documentElement && document.documentElement.scrollTop)
		return document.documentElement.scrollTop;
	// Internet Explorer 6, 7 and 8
	if (document.body.scrollTop) return document.body.scrollTop;
	return 0;
}

function elmYPosition(eID) {
	var elm = document.getElementById(eID);
	var y = elm.offsetTop;
	var node = elm;
	while (node.offsetParent && node.offsetParent != document.body) {
		node = node.offsetParent;
		y += node.offsetTop;
	} return y;
}

function smoothScroll(eID) {
	var startY = currentYPosition();
	var stopY = elmYPosition(eID);
	var distance = stopY > startY ? stopY - startY : startY - stopY;
	if (distance < 100) {
		scrollTo(0, stopY); return;
	}
	var speed = Math.round(distance / 50);
	if (speed >= 20) speed = 20;
	var step = Math.round(distance / 25);
	var leapY = stopY > startY ? startY + step : startY - step;
	var timer = 0;
	if (stopY > startY) {
		for ( var i=startY; i<stopY; i+=step ) {
			setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
			leapY += step; if (leapY > stopY) leapY = stopY; timer++;
		} return;
	}
	for ( var i=startY; i>stopY; i-=step ) {
		setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
		leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
	}
}			
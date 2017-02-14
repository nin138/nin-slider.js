"use strict";
var nin = {};
nin.onload =[];
function ninStart() {
	class NinLibController {
		constructor(onload) {
			window.addEventListener("resize", this.onResize.bind(this));
			this.modal;
			this.tab;
			this.slider;
			this.itemSlider;
			this.scWidth;
			this.scHeight;
			this.onload = onload;
		}
		init() {
			this.scWidth = window.innerWidth;
			this.scHeight = window.innerHeight;
			this.initItemSlider();
			this.initTab();
			this.initModal();
			this.initSlider();
			for(var i = 0; i< this.onload.length; i++) this.onload[i]();
			this.onload = {};
			this.onload.push = function(fn) { fn(); };
		}
		initItemSlider() {
			this.itemSlider = [];
			var list = document.getElementsByClassName('nin_item-slider');
			for (var i = 0; i < list.length; i++) {
				this.itemSlider.push(new NinItemSlider(list[i]));
			}
		}
		initTab() {
			this.tab = [];
			var list = document.getElementsByClassName('nin_tab');
			for (var i = 0; i < list.length; i++) {
				this.tab.push(new NinTab(list[i]));
			}
		}
		initModal() {
			var modalEls = document.getElementsByTagName("nin-modal");
			for (var i = 0; i < modalEls.length; i++) {
				modalEls[i].style.display = "none";
				modalEls[i].style.zIndex = "1000";
				modalEls[i].style.position = "fixed";
			}
			this.modal = new NinModalController();
		}
		initSlider() {
			this.slider = [];
			var ninSliderElement = document.getElementsByClassName('nin_slider');
			for (var i = 0; ninSliderElement.length > i; i++) {
				this.slider.push(new NinSlider(ninSliderElement[i]));
			}
		}
		getItemSliderById(id) {
			for(var i = 0; i < this.itemSlider.length; i++) if(this.itemSlider[i].id == id) return this.itemSlider[i]; 
			return null;
		}
		onResize() {
			this.scWidth = window.innerWidth;
			this.scHeight = window.innerHeight;
			this.modal.onResize();
			this.resizeItemSlider();
		}
		resizeItemSlider() {
			for(var i = 0; i < this.itemSlider.length; i++) this.itemSlider[i].onResize();
		}
		getPageX(ev) { return ev.pageX || ev.changedTouches[0].pageX; }
		getPageY(ev) { return ev.pageY || ev.changedTouches[0].pageY; }
	}

	class Slidable {
		constructor() {
			this.translate = {
				val: 0,
				to: null,
				max: 1,
				from: null,
				percent: 0,
			};
			this.field;
			this.option = { size: 3, scrollVolume: 3, spd: 5 };
		}
		slideTo() {
			this.translate.percent += this.option.spd;
			this.translate.val += this.translate.amount;
			if(this.translate.percent < 100) setTimeout(this.slideTo.bind(this), 10);
			else this.translate.val = this.translate.to;
			this.field.style.transform = "translateX("+this.translate.val+"px)";
		}
		checkCollision_(isVal) {
			if(this.translate.to >= 0) {
				this.translate.to = 0;
				this.arrow.left.className = "nin_is_arrow-inactive";
			} else this.arrow.left.className = "nin_is_arrow";
			if(this.translate.to <= this.translate.max) {
				this.translate.to = this.translate.max;
				this.arrow.right.className = "nin_is_arrow-inactive";
			} else this.arrow.right.className = "nin_is_arrow";
		}
	}

	class FreeSlidable extends Slidable {
		constructor() {
			super();
			this.clicking = false;
			this.velocity;
			this.click = {
				flag: false,
				now: {},
				before: {},
				start: null
			};
		}
		move_() {
			this.checkCollision_();
			this.translate.val = this.translate.to;
			this.field.style.transform = "translateX("+this.translate.val+"px)";
		}
		inertia_() {
			this.translate.to += this.velocity;
			if(this.velocity != 0) this.velocity *= 0.93;
			this.move_();
			if(Math.abs(this.velocity)>0.01) setTimeout(this.inertia_.bind(this), 20);
		}
		onMousedown_(ev) {
			this.click.flag = true;
			this.click.now.point = nin.getPageX(ev);
			this.click.before.point = this.click.now.point;
			this.click.now.time = ev.timeStamp;
			this.click.before.time = ev.timeStamp;
			this.click.start = this.click.now.point;
		}
		onMousemove_(ev) {
			if(this.click.flag) {
				ev.preventDefault();
				if(this.click.now.time != ev.timeStamp) {
					this.click.before.time = this.click.now.time;
					this.click.now.time = ev.timeStamp;
					this.click.before.point = this.click.now.point;
					this.click.now.point = nin.getPageX(ev);
					this.translate.to -= this.click.before.point - this.click.now.point;
				}
				this.move_();
			}
		}
		onMouseup_(ev) {
			if(this.click.flag) {
				this.click.flag = false;
				var pageX = nin.getPageX(ev);
				if(Math.abs(pageX - this.click.start) < 30) {
					var func = this.events[ev.target.getAttribute("data-nin")];
					if(func) func();
				} else {
					if(ev.timeStamp - this.click.now.time < 200 && this.click.now.time - this.click.before.time != 0) {
						this.velocity = (this.click.now.point - this.click.before.point)/(this.click.now.time - this.click.before.time)*20;
					} else this.velocity = 0;
					this.inertia_();
				}
			}
		}
		addListeners() {
			this.field.addEventListener('mousedown', this.onMousedown_.bind(this));
			this.field.addEventListener('mouseup', this.onMouseup_.bind(this));
			this.field.addEventListener('mousemove', this.onMousemove_.bind(this));
			this.field.addEventListener('mouseleave', this.onMouseup_.bind(this));
			this.field.addEventListener('touchstart', this.onMousedown_.bind(this));
			this.field.addEventListener('touchend', this.onMouseup_.bind(this));
			this.field.addEventListener('touchmove', this.onMousemove_.bind(this));
		}
	}

	class NinItemSlider extends FreeSlidable {
		constructor(el) {
			super();
			this.count = 0;
			this.el = el;
			this.id = this.el.id;
			this.field = document.createElement("div"); 
			this.arrow = {
				left: document.createElement("div"),
				right: document.createElement("div")
			};
			this.events = {};
			this.width;
			this.init();
		}
		init() {
			var ops = this.el.getAttribute("data-option");
			if(ops) {
				var obj = JSON.parse(ops);
				for(var op in obj) this.option[op] = obj[op];
			}
			while(this.el.children.length) {
				this.addItem_(this.el.children[0]);
			}
			this.field.className = "nin_is_field";
			this.arrow.left.className = "nin_is_arrow";
			this.arrow.left.innerHTML = "<<";
			this.arrow.right.className = "nin_is_arrow";
			this.arrow.right.innerHTML = ">>";
			this.el.appendChild(this.arrow.left);
			this.el.appendChild(this.field);
			this.el.appendChild(this.arrow.right);
			this.width = this.field.clientWidth;
			this.arrow.left.onclick = this.onArrowClicked_.bind(this, true);
			this.arrow.right.onclick = this.onArrowClicked_.bind(this, false);
			this.addListeners();
			this.calcSize_();
			this.checkCollision_();
		}
		addItem_(el) {
			el.setAttribute("data-nin", this.count);
			this.events[this.count] = el.onclick;
			el.onclick = null;
			this.count++;
			el.classList.add("nin_is_item");
			el.style.flexBasis = "calc(100%/"+ this.option.size +")";
			this.field.appendChild(el);
		}
		calcSize_() {
			this.width = this.field.clientWidth;
			this.translate.max = 0 - (this.field.children.length - this.option.size) * this.width / this.option.size;
		}
		onResize() {
			var beforeMax = this.translate.max;
			this.calcSize_();
			this.checkCollision_();
			this.translate.val *= this.translate.max / beforeMax;
			this.field.style.transform = "translateX("+ this.translate.val +"px)";
		}
		add(el) {
			this.addItem_(el);
			this.calcSize_();
			this.checkCollision_();
		}
		deleteAll() {
			this.field.textContent = "";
			this.calcSize_();
			this.checkCollision_();
		}
		onArrowClicked_(isLeft) {
			if(isLeft) this.translate.to = this.translate.val + this.width/this.option.size*this.option.scrollVolume;
			else this.translate.to = this.translate.val - this.width/this.option.size*this.option.scrollVolume;
			this.checkCollision_();
			this.translate.amount = (this.translate.to - this.translate.val)/100*this.option.spd;
			this.translate.percent = 0;
			this.slideTo();
		}
	}

	class NinTab {
		constructor(el) {
			this.el = el;
			this.class = {
				active: "",
				inactive: ""
			};
			this.activeContent;
			this.titles = this.el.children[0].children;
			this.content = this.el.children[1];
			this.contentItems = this.content.children;
			this.contentHeight = this.content.offsetHeight;
			this.contentIsOpen = false;
			this.heightChangeVal = 0;
			this.slideVal = 0;
			this.slideFrom;
			this.init();
		}
		init() {
			var classList = this.el.children[0].classList;
			for (var i = 0; i < classList.length; i++) {
				if(classList[i].startsWith('active')) this.class.active = classList[i];
				else if(classList[i].startsWith('inactive')) this.class.inactive = classList[i];
			}
			this.el.children[0].className = "nin_tab_titles";
			for(var i = 0; i < this.titles.length; i++) this.titles[i].className = this.class.inactive;
			this.content.style.height = "0";
			for(var i = 0; i < this.titles.length; i++) this.titles[i].addEventListener('mousedown', this.clicked.bind(this, i));
			this.content.classList.add("nin_tab_content-list");
			for(var i = 0; i < this.contentItems.length; i++) {
				this.contentItems[i].style.display = "none";
				this.contentItems[i].classList.add("nin_tab_content");
			}
		}
		clicked(num, event) {
			if(!this.contentIsOpen) this.open(num);
			else if(this.activeContent == num) this.close();
			else {
				this.titles[this.activeContent].className = this.class.inactive;
				this.slideFrom = this.activeContent;
				this.active(num);
				this.contentItems[num].style.transform = (this.slideFrom > num)? "translateX(-100%)" : "translateX(100%)";
				this.slide();
			}
		}
		open(num) {
			this.activeContent = num;
			this.contentIsOpen = true;
			this.contentItems[num].style.transform = "translateX(0px)";
			this.active(num);
			this.changeHeight();
		}
		close() {
			this.contentIsOpen = false;
			this.changeHeight();
		}
		slide() {
			if(this.slideFrom > this.activeContent) {
				this.slideVal	+= 10;
				this.contentItems[this.activeContent].style.transform = "translateX(" + (this.slideVal-100) + "%)";
			} else {
				this.slideVal	-= 10;
				this.contentItems[this.activeContent].style.transform = "translateX(" + (this.slideVal+100) + "%)";
			}
			this.contentItems[this.slideFrom].style.transform = "translateX(" + this.slideVal + "%)";
			
			if(Math.abs(this.slideVal) < 100) setTimeout(this.slide.bind(this),30);
			else {
				this.slideFrom = null;
				this.slideVal = 0;
			}
		}
		changeHeight() {
			this.heightChangeVal += (this.contentIsOpen)? 10 : -10 ;
			this.content.style.height = this.contentHeight*this.heightChangeVal/100 + "px";
			if (this.contentIsOpen == true && this.heightChangeVal<100 || this.contentIsOpen == false && this.heightChangeVal > 0) {
				setTimeout(this.changeHeight.bind(this), 20);
			}
			else if(this.contentIsOpen == false && this.heightChangeVal < 1) {
				this.inactive(this.activeContent);
			}
		}
		active(num) {
			this.activeContent = num;
			this.contentItems[num].style.display = "block";
			this.titles[num].className = this.class.active;
		}
		inactive(num) {
			this.contentItems[num].style.display = "none";
			this.titles[num].className = this.class.inactive;
		}
	}

	class NinSlider {
		constructor(el) {
			this.el = el;
			this.contents = [];
			for(var i = 0; i < el.children.length; i++) this.contents.push(el.children[i]);
			this.linkField;
			this.linkEls = [];
			this.events =[];
			this.active = 0;
			this.length = this.contents.length;
			this.timer;
			this.clickPoint;
			this.action = {
				moving: false,
				translate: 0,
				direction: null,
				from: null,
				nextAction: null
			};
			this.option = {
				spd: 5,
				auto: true,
				auto_interval: 4000
			};
			this.setOption(this.el.getAttribute("data-option"));
			this.init();
			this.onResize();
		}
		setOption(option) {
			if(option) {
				try {
					option = JSON.parse(option);
					for(var key in option) this.option[key] = option[key];
				} catch(e) { console.log(e);}
			}
		}
		onResize() {
			for(var i = 0; i < this.linkEls.length; i++) this.linkEls[i].style.width = this.linkEls[i].offsetHeight + "px";
		}
		init() {
			this.setArrow();
			this.linkField = document.createElement('ul');
			this.linkField.className = "nin_slider_link-field";
			this.el.appendChild(this.linkField);
			for(var i = 0; i < this.contents.length; i++) {
				this.events[i] = this.contents[i].onclick;
				if(i != 0)this.contents[i].style.transform = "translateX(100%)";
				this.contents[i].onclick = null;
				var linkEl = document.createElement('li');
				linkEl.onclick = this.linkClicked.bind(this, i);
				this.linkField.appendChild(linkEl);
				this.linkEls[i] = linkEl;
			}
			this.el.addEventListener('mousedown', this.onMousedown.bind(this));
			this.el.addEventListener('mouseup', this.onMouseup.bind(this));
			this.el.addEventListener('touchstart', this.onMousedown.bind(this));
			this.el.addEventListener('touchend', this.onMouseup.bind(this));
			this.onSlide(0);
		}
		setArrow() {
			var leftarrow = document.createElement('span');
			leftarrow.className = "nin_slider_arrow";
			var rightarrow = document.createElement('span');
			rightarrow.className = "nin_slider_arrow";
			leftarrow.style.left = 0;
			rightarrow.style.right = 0;
			leftarrow.innerHTML = "<<";
			rightarrow.innerHTML = ">>";
			leftarrow.onclick = this.arrowClicked.bind(this, 0);
			rightarrow.onclick = this.arrowClicked.bind(this, 1);
			this.el.appendChild(rightarrow);
			this.el.appendChild(leftarrow);
		}
		onSlide(num) {
			for(var i = 0; i < this.linkEls.length; i++) this.linkEls[i].className = (i == num)? "nin_slider_link-active" : "nin_slider_link-inactive";
			if(this.option.auto) {
				clearTimeout(this.timer);
				this.timer = setTimeout(this.arrowClicked.bind(this, 1), this.option.auto_interval);
			}
		}
		onMousedown(ev) {
			this.clickPoint = nin.getPageX(ev);
		}
		onMouseup(ev) {
			var mouseUp = nin.getPageX(ev);
			if (this.clickPoint > mouseUp && this.clickPoint > mouseUp + 50) {
				this.arrowClicked(0);
				ev.preventDefault();
			} else if(this.clickPoint < mouseUp && this.clickPoint + 50 < mouseUp) {
					this.arrowClicked(1);
					ev.preventDefault();
			} else {
				for(var i = 0; i < this.contents.length; i++) {
					if(this.contents[i] === ev.target && this.events[i]) this.events[i]();
				}
			}
		}
		linkClicked(num) {
			if(!this.action.moving) {
				if(num != this.active) {
					var a = (this.active - num < 1)? this.active + this.contents.length - num : this.active - num;
					var b = (num - this.active < 1)? num + this.contents.length - this.active : num - this.active;
					this.direction = (a >= b )? "left" : "right";
					this.moveTo(num);
				}	
			} else this.nextAction = num;
		}
		arrowClicked(num) {
			var dir = (num == 0)? this.active -1 : this.active +1;
			if(dir < 0 ) dir = this.length-1;
			else if(dir >= this.length) dir = 0;
			this.linkClicked(dir)
		}
		moveTo(num) {
			this.action.from = this.active;
			this.active = num;
			this.contents[this.active].style.display = "block";
			this.contents[this.active].style.transform = (this.direction == "left")? "translateX(100%)" : "translateX(-100%)";
			this.action.moving = true;
			this.slide();
			this.onSlide(num);
		}
		slide() {
			this.action.translate += this.option.spd;
			if(this.action.translate > 100) this.action.translate = 100;
			if(this.direction == "right") {
				this.contents[this.action.from].style.transform = "translateX(" + ( 0 - this.action.translate) + "%)";
				this.contents[this.active].style.transform = "translateX(" + (100 - this.action.translate) + "%)";
			} else {
				this.contents[this.action.from].style.transform = "translateX(" + this.action.translate + "%)";
				this.contents[this.active].style.transform = "translateX(" + (this.action.translate - 100) + "%)";
			}
			if(this.action.translate > 99) {
				this.action.translate = 0;
				this.action.moving = false;
				if(this.nextAction != null) {
					this.linkClicked(this.nextAction);
					this.nextAction = null;
				}
			} else setTimeout(this.slide.bind(this), 20);
		}
	}

	class NinModalController {
		constructor() {
			this.activeModal = null;
			this.activeModalPosition = null;
			this.scale = 0;
			this.modalField = document.createElement('div');
			this.modalField.className = "nin_modal_field";
			this.modalField.style.width = nin.scWidth + "px";
			this.modalField.style.height = nin.scHeight + "px";
			this.modalField.style.visibility = "hidden";
			document.body.appendChild(this.modalField);
			this.modalField.addEventListener('mousedown', this.close.bind(this));
		}
		show(id) {
			this.activeModal = document.getElementById(id);
			this.activeModal.style.display = "block";
			this.modalField.style.visibility = "visible";
			this.setPosition();
			this.scalePlus();
		}
		scalePlus() {
			this.scale +=0.04;
			this.activeModal.style.transform = "scale("+this.scale+","+this.scale+")";
			if(this.scale < 1) setTimeout(this.scalePlus.bind(this), 10);
		}
		close() {
			this.activeModal.style.display = "none";
			this.activeModal = null;
			this.activeModalPosition =null;
			this.modalField.style.visibility = "hidden";
			this.scale = 0;
		}
		onResize() {
			this.modalField.style.width = nin.scWidth + "px";
			this.modalField.style.height = nin.scHeight + "px";
			if (this.activeModal != null) this.setPosition();
		}
		setPosition() {
			this.activeModal.style.left = (nin.scWidth - this.activeModal.offsetWidth)/2 + "px";
			this.activeModal.style.top = (nin.scHeight - this.activeModal.offsetHeight)/2 + "px";
		}
	}
	nin = new NinLibController(nin.onload);
	nin.init();
}

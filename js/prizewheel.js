/**
 * 大转盘 Prize Wheel
 * @author rubekid 
 */
(function(){
	
	/**
	 * 样式兼容前缀
	 */
	var cssPrevfix = ["", "-webkit-", "-moz-", "-ms-", "-o-"];
	
	/**
	 * 获取元素样式
	 * @param Element el
	 */
	function getStyle(el){
		if(window.getComputedStyle){
			return window.getComputedStyle(el,null); 
		}
		return el.currentStyle;
	}
	/**
	 * 获取元素指定样式值
	 * @param Element el
	 * @param String name
	 */
	function getStyleValue(el, name){
		var style = getStyle(el);
		return style[name].replace(/px/i, '');
	}
	
	/**
	 * 设置样式
	 * @param Element el
	 * @param JSON css
	 */
	function setStyle(el, css){
		for(var i in css){
			el.style[i] = css[i];
		}
	}
	
	/**
	 * 获取随机颜色值
	 */
	function getColor(){
		var random = function(){
			return Math.floor(Math.random()*255);
		}
		return "rgb("+random()+","+random()+","+random()+")";
	}
	
	/**
	 * 创建样式表
	 * @param String cssStr
	 */
	 function createStyle(cssStr){
		if( document.createStyleSheet){
			var style = document.createStyleSheet();
			style.cssText = cssStr;
		}
		else{
			var style = document.createElement("style");
			style.type = "text/css";
			style.textContent = cssStr;
			document.getElementsByTagName("head").item(0).appendChild(style);
		}
		
	}
	
	/**
	 * 大转盘类 Prize Wheel
	 * @param JSON options
	 */
	function PrizeWheel(options){
		this.key = (new Date()).getTime();
		this.init(options);
	}
	PrizeWheel.prototype = {
		init : function(options){
			options = options || {};
			this.afterReady = []; //准备就绪后执行的方法队列
			var _this = this;
			
			//系统默认
			var _default = {
				diameter : 500, //大转盘直径
				centerDiameter : 120, //圆心直径
				runningClassName : "running", //运转时标签的class属性值 
				rotateClassName : "rotate",  //转动class名称
				resultClassName : "result", //开奖时标签的class属性值前缀
				number : 8, // 分区数 
				bufferTime : 3,  //开奖缓冲时间 (单位：s)
				bufferTurns : 2, //开奖缓冲的圈数	
				speed : 0.2 , // 旋转速度 
				timeout : 3, //自动开奖时间间隔(单位：s)
				lockTime : 0,  //开奖按钮锁定时间(单位：s)
				colors : ["#fff8c9", "#ffe484"], //分区着色
				awards : null, //奖项数据 e.g. [{text:"恭喜您", src: "images/01.png"},{text:"恭喜您"},{src: "images/01.png"}]
				src : null , // 大转盘图片,
				style : 0, //样式 箭头方向: 0 上 1 右 2 下 3 左
				textStyle: 0, // 0横向显示支持换行符号(默认) 1 纵向显示 不显示图片
				fontFamily : "楷体", //字体
				fontColor : "#510201", //字体颜色
				lottery :function(){ //开奖方法
					return parseInt(Math.random() * _this.options.number);
				},
				afterLottery : function(index){} //开奖后回调
				
			};
			this.options = _default;
			for(var k in options){
				this.options[k] = options[k];
 			}
			this.initRotate();
			
			/**
			 * 初始化容器
			 */
			this.container = document.getElementById(options.containerId);
			if(!this.container){
				this.container = document.createElement("div");
				setStyle(this.container, {
					width : this.options.diameter + "px",
					height : this.options.diameter + "px",
					margin : "50px auto auto"
				});
				document.body.appendChild(this.container);
			}
			setStyle(this.container, {
				position : "relative",
				overflow : "hidden"
			});
			
			/**
			 * 获取转盘标签对象
			 */
			if(this.options.awards){
				this.readyCount = 0;
				var awards = this.options.awards;
				if(!awards || awards.length == 0 ){
					alert("奖品设置错误！");
					return false;
				}
				if(awards.length % this.options.colors.length == 1){
					alert("首尾颜色重复，请调整颜色个数！");
					return false;
				}
				this.target = this.create({
					awards : awards
				});
			}
			else if(this.options.src){
				this.target = this.createByImage(this.options.src);
			}
			else{
				alert("请配置正确参数！");
				return false;
			}

			this.createArrow();
			this.initPartitions();
			this.initAnimateCss();
			
			this.bindEvent();
		},
		/**
		 * 开始
		 */
		start:function(){
			if(this.state == 1){
				return ;
			}
			this.state = 1;
			this.target.className = this.options.runningClassName;
			//自动结束
			var _this = this;
			if(this.options.timeout > 0){
				this.stopTimeout = setTimeout(function(){
					_this.stop();
				}, this.options.timeout * 1000);
			}
		},
		/**
		 * 结束
		 */
		stop:function(){
			if(this.target.className == this.options.runningClassName){
				if(this.stopTimeout){//兼容停止按钮和自动停止多次触发
					clearTimeout(this.stopTimeout);
				}
				var index = this.options.lottery();
				this.target.className = this.options.resultClassName + index;
				this.options.afterLottery(index);
				var _this = this;
				setTimeout(function(){
					_this.state = 0;
				}, (this.options.bufferTime + this.options.lockTime) * 1000);
				
			}
		},
		/**
		 * 素材准备就绪
		 */
		ready:function(){
			this.readyCount ++;
			if(this.readyCount < this.options.number){
				return ;
			}
			
			for(var i in this.afterReady){
				if(typeof this.afterReady[i] == "function"){
					this.afterReady[i]();
				}
			}
			
		},
		/**
		 * 事件绑定
		 */
		bindEvent:function(){
			var startBtn = this.options.startId ? document.getElementById(this.options.startId) : null;
			var stopBtn =  this.options.stopId ? document.getElementById(this.options.stopId) : null;
	
			var _this = this;
			this.arrow.onclick = function(){
				_this.start();
			};
			
			if(startBtn){
				startBtn.onclick = function(){
					_this.start();
				};
			}
			
			if(stopBtn){
				 stopBtn.onclick = function(){
					_this.stop();
				};
			}
			else if(this.options.time < 1){
				this.options.time = 3;
			}
		},
		/**
		 * 初始化转盘旋转角度
		 */
		initRotate:function(){
			this.options.rotate = 0;
			switch(this.options.style){
				case 1 : this.options.rotate =  Math.PI / 2; break;
				case 2 : this.options.rotate =  Math.PI ; break;
				case 3 : this.options.rotate =  Math.PI * 3 / 2; break;
			}
		}, 
		/**
		 * 初始化动画样式
		 */
		initAnimateCss:function(){
			var css = this.createKeyframes();
			createStyle(css);
		},
		/**
		 * 初始化分区信息
		 */
		initPartitions:function(){
			var angle = 360 / this.options.number;
			var _angle = angle / 2;
			this.partitions = [];
			for(var i=0; i< this.options.number; i++){
				this.partitions.push({
					angle : 360 - i * angle - _angle
				});
			}
		},
		/**
		 * 初始化奖项信息
		 */
		initAwards:function(awards){
			var _this = this;
			for(var i in awards){
				(function(award){
					if(award.src){
						var image = new Image();
						image.onload = function(){
							award.image = this;
							_this.ready();
						}
						image.src = award.src;
					}
					else{
						_this.ready();
					}
				})(awards[i]);
				
			}
		},
		/**
		 * 创建大转盘
		 */
		create:function(data){
			var width = this.options.diameter;
			var radius = width / 2;
			var canvas = document.createElement("canvas");
			this.options.number = data.awards.length;//分区数
			
			data.radius = radius;
			data.innerRadius =  this.options.centerDiameter / 2;
			
			canvas.width = width;
			canvas.height = width;
			if(data.className){
				canvas.className = data.className;
			}
			this.container.appendChild(canvas);
			var context = canvas.getContext("2d");
			context.translate(radius, radius);
			
			var _this = this;
			this.afterReady.push(function(){
				_this.drawPrizeWheel(context, data);
				_this.drawAwards(context, data);
				if(_this.options.rotate){
					context.restore();
					context.rotate( _this.options.rotate );
					context.drawImage(canvas, -radius, -radius, width, width);
				}
			});
			this.initAwards(data.awards);
			return canvas;
		},
		/**
		 * 由图片生成盘区 
		 */
		createByImage:function(src){
			var width = this.options.diameter;
			var canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = width;
			this.container.appendChild(canvas);
			var context = canvas.getContext("2d");
			var image = new Image();
			image.onload = function(){
				context.drawImage(this, 0, 0, width, width);
			};
			image.src = src;
			
			return canvas;
		},
		/**
		 * 创建开奖箭头
		 */
		createArrow:function(){
			var border = 8;
			var width = (this.options.centerDiameter + border) * 2;
			var height = width;
			var radius = width / 4;
			var cx = width / 2, cy = height / 2;
			var canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			var context = canvas.getContext("2d");
			context.translate(cx, cy);
			context.save();
			
			context.rotate( this.options.rotate);
			
			//径向渐变
			/*var gradient= context.createRadialGradient(cx, cy, 0, cx, cy, radius * 3);
			gradient.addColorStop(0, "#f8d26f");  
			gradient.addColorStop(1, "#ffffff"); */
			
			var gradient = context.createLinearGradient(0, height, 0, height - width);
			gradient.addColorStop(0, "#620302");
			gradient.addColorStop(1, "#cd0f0d");
			
			context.beginPath();
			context.moveTo(0, -cy );
			context.lineTo(radius/2, 0);
			context.lineTo( - radius/2 , 0);
			context.lineTo(0, -cy);
			context.fillStyle = gradient;
			context.arc(0, 0, radius - 1 , 0, 2 * Math.PI);//半径略小，避免边框边缘毛糙
			context.fill();
			context.restore();
			context.save();
			
			//绘制边框
			var borderGradient = context.createRadialGradient(cx, cy, radius -border, cx, cy, radius);
			borderGradient.addColorStop(0, "#f3f3f3");
			borderGradient.addColorStop(0.5, "#E0E0E0");
			borderGradient.addColorStop(1, "#f3f3f3");
			
			context.beginPath();
			context.arc(0, 0 , radius - border/2, 0, 2 * Math.PI);
			context.lineWidth = border; 
			context.strokeStyle = borderGradient;
			context.stroke();
			
			//绘制文字
			context.fillStyle = borderGradient;
			context.font="bold 40px " + this.options.fontFamily;
			context.textAlign="center";
			context.textBaseline="middle";
			
			context.fillText( "开始",  0,  - 20 );
			context.fillText( "抽奖",  0,  + 20 );
			context.save();
			
			var left = (this.target.width || getStyleValue(this.target, "width")) / 2 - cx; 
			var top = (this.target.height || getStyleValue(this.target, "height")) / 2 - cy;
			this.arrow = canvas;
			this.arrow.style.cssText = "position:absolute;left:" + left + "px;top:" + top + "px;cursor:pointer;";
			this.container.appendChild(this.arrow);
		},
		/**
		 * 绘制盘区
		 */
		drawPrizeWheel:function(context, data){
			var colors = this.options.colors;
			var cLen = colors.length;
			var angle = 2 * Math.PI / this.options.number;
			var radius = data.radius;
			var innerRadius = data.innerRadius;
			
			context.save();
			context.beginPath();
			context.rotate(0);
			
			//绘制分区
			for ( var i = 0; i < this.options.number; i++) {
				context.save();
				context.beginPath();
				context.moveTo(0, 0);
				context.fillStyle= colors[i % cLen];
				context.arc(0 , 0, radius, i * angle - Math.PI /2 , ( i + 1 ) * angle - Math.PI /2);
				context.fill();
				context.restore();
			}
			
			//绘制空心区域
			/*context.save();
			context.beginPath();
			context.fillStyle="#FFFFFF";
			context.arc( 0, 0, innerRadius, 0, 2 * Math.PI );
			context.fill();
			context.restore();*/
			
			//空心区边框			
			/*context.beginPath();
			context.arc(0, 0, innerRadius + 4, 0, 2 * Math.PI, true); 
			context.lineWidth = 8.0; 
			context.strokeStyle = "#eee8c9";
			context.stroke();*/
			
			//绘制外边框
			context.beginPath();
			context.arc(0, 0, radius - 4, 0, 2 * Math.PI, true); 
			context.lineWidth = 6.0; 
			context.strokeStyle = "#fcf200";
			context.stroke();
			
			context.beginPath();
			context.arc(0, 0, radius - 12, 0, 2 * Math.PI, true); 
			context.lineWidth = 12.0; 
			context.strokeStyle = "#510201";
			context.stroke();
			
		},
		/**
		 * 绘制奖项
		 */
		drawAwards:function(context, data){
			var marginTop = this.options.textStyle ? 40 : 50;
			
			var angle = 2 * Math.PI / this.options.number;
			var radius = data.radius;
			var innerRadius = data.innerRadius;
			var top = -radius + marginTop;
			var minY =  data.innerRadius + 20;
			context.fillStyle = this.options.fontColor;
			context.font = "bold 22px " + this.options.fontFamily;
			context.textAlign = "center";
			context.textBaseline = "middle";
			context.save();
			context.rotate( angle / 2 );

			for ( var i = 0; i < this.options.number; i++) {
				var award = data.awards[i];
				var y = top;
				context.save();
				context.beginPath();
				context.rotate(  i * angle );
				if(award.text){
					var texts = award.text.split("\n");
					if(this.options.textStyle == 1){
						texts = award.text.replace(/\n/g, "").split("");
					}
					
					for(var j in texts){
						context.fillText( texts[j],  0, y );
						y += 28;
						if(y >  - minY){
							break;
						}
					}
				}
				
				if(award.image && !this.options.textStyle){
					var _y = top;
					var rate = award.image.height / award.image.width;
					var _width = 90;
					var _height =  _width * rate;
					if(award.text){
						_width = 60;
						_height =  _width * rate;
						_y =  - minY - _height;
					}
					else if(_y > -minY -_height){
						_y =  - minY - _height;
					}
					context.drawImage(award.image, (angle - _width) / 2, _y, _width, _height);
				}
				context.restore();
			}
		},
		/**
		 * 创建关键帧
		 */
		createKeyframes:function(){
			var css = [];
			var runningCss = [];
			var resultCss = []; 
			
			
			/**
			 * 转动 
			 */
			for(var i in cssPrevfix){
				var k = cssPrevfix[i];
				css.push('@' + k + 'keyframes ' + this.options.rotateClassName + ' {from {' + k + 'transform: rotate(0deg);} to {' + k + 'transform: rotate(360deg);}}');
				runningCss.push( k + 'animation: ' + this.options.rotateClassName + ' ' + this.options.speed + 's linear infinite;');
				resultCss.push( k + 'transform: rotate({angle}deg); '+ k +'animation: ' + this.options.resultClassName + '{id} ' + this.options.bufferTime + 's ease-out 1;');
			}
			
			css.push('.' + this.options.runningClassName + '{' + runningCss.join('') + '}');

			/**
			 * 各分区中奖角度
			 */
			for(var i in this.partitions){
				var partition = this.partitions[i];
				var angle = partition.angle + this.options.bufferTurns * 360 ;
				
				for(var j in cssPrevfix){
					var k = cssPrevfix[j];
					css.push('.' + this.options.resultClassName + i + '{' + resultCss.join('').replace(/\{id\}/g, i).replace(/\{angle\}/g, angle % 360 ) + '}');
					css.push('@' + k + 'keyframes ' + this.options.resultClassName + i + '  {from {' + k + 'transform: rotate(0deg);} to {' + k + 'transform: rotate(' + angle + 'deg);}}');
				}
			}
			
			return css.join("\n");
		}
	};
	
	window.PrizeWheel = PrizeWheel;

})();

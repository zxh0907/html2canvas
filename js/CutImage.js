//base on html2canvas.js
var CutImage = (function(){
	var G = function(id){return document.getElementById(id); }
	var addEvent = function(oElm, eType, handler, isUseCapture){
		if(document.addEventListener){	
			if(eType.substr(0,2) === "on"){
				eType = eType.substr(2);
			}
			isUseCapture = !!isUseCapture;
			oElm.addEventListener(eType, handler, isUseCapture);
		} else if(document.attachEvent) {
			if(eType.substr(0,2) !== "on"){
				eType = "on" + eType;
			}
			oElm.attachEvent(eType, handler);
		}
	};
	var removeEvent = function(oElm, eType, handler, isUseCapture){
		if(document.addEventListener){	
			if(eType.substr(0,2) === "on"){
				eType = eType.substr(2);
			}
			isUseCapture = !!isUseCapture;
			oElm.removeEventListener(eType, handler, isUseCapture);
		} else if(document.attachEvent) {
			if(eType.substr(0,2) !== "on"){
				eType = "on" + eType;
			}
			oElm.detachEvent(eType, handler);
		}
	};
	var setStyle = function(oElm, css){
		for(var k in css){
			oElm.style[k] = css[k];
		}
	};
	var _cutImg = {	
		"init": function(options){					
			var _t = this;
			this.reset();
			if(options){
				_t.initOptions(options);
			}				
			_t.initMask();
			var _opt = _t.options;
			if(_opt["showFinish"] && (!_opt["btnFinish"])){
				_t.showBtnFinish();
			}
			if(_t.btnFinish){
				addEvent(_t.btnFinish, "click", function(){
					_t.unstall();
					_t.cut({
						"rects" : _t.rects,
						"beforeRender" : _t.options["beforeRender"],
						"onRenderedCbk" : _t.options["onRendered"],
						"htmlWapper" : _t.options["maskArea"]
					});
				});	
			}
			console.log(document.body.scrollTop);
		},
		//重置所有参数
		"reset": function(){
			this._perBegin = {"x": 0, "y": 0};   //每次绘制的起点
			this._prevRect = null;       //在绘制状态下，记录前一次绘制的矩形
			this._isDrawing =  false;     //是否正在绘制状态
			this._prevMouseInRect =  -1;  //记录上次鼠标在哪个矩形(-1为所有都不在)

			this.rects = [];             //绘制的所有矩形
			this.lineWidth = 2;          //矩形线框宽度
			this.maskId = "CutImgMask";  //蒙板ID
			this.mask = null;            //蒙板
			this.maskCtx = null;         //蒙板Context
			this.btnFinish = null;       //完成截图按钮
			this.btnDelId = "cutImg_btnDel";    //删除按钮ID


			this["options"] = {
				"maskArea" : document.body,         //蒙板区域 obj
				"maskZindex": 99,
				"useProxy": false,                  //是否使用代理
				"proxy" : "html2canvasproxy.php",   //默认代理
				"showFinish": true,
				"btnFinish" : null,
				"beforeRender" : function(){ },
				"onRendered": function(){ }
			};
		},
		cut: function(options){
			var _t = this;
			var rects = options["rects"],
				beforeRender = options["beforeRender"] || function(){},
				onRenderedCbk = options["onRenderedCbk"] || function(){},
				htmlObj = options["htmlWapper"] || document.body;
			var canvasOptions = {     
                onrendered: function(canvas) {
                	// canvas is the final rendered <canvas> element
                    try{
                        var tmpCtx1 = canvas.getContext("2d");
						var imgs = [];

						for(var i = 0, l = rects.length; i < l ; i ++){		
							var rect = rects[i];
							var	imgData = tmpCtx1.getImageData(rect["x"] - document.body.scrollLeft, rect["y"] - document.body.scrollTop, rect["w"], rect["h"]);
							var tmpCanvas = document.createElement("canvas");	
													
							tmpCanvas.width = imgData.width;
							tmpCanvas.height = imgData.height;
							var tmpCtx2 = tmpCanvas.getContext("2d");	
							tmpCtx2.putImageData(imgData, 0, 0);
							
							var dataUrl = tmpCanvas.toDataURL("image/png");
							imgs.push({"dataUrl": dataUrl, "width": imgData.width, "height": imgData.height});
						}

						if(onRenderedCbk){
							onRenderedCbk({"canvas": canvas, "imgs" : imgs});
						}
                    }catch(err){
                        throw err;
                    }
                }
            };

            if(_t.options["useProxy"]){
            	canvasOptions["proxy"] = _t.options["proxy"];
            }
            if(beforeRender){
            	beforeRender(rects);
            }
			html2canvas(htmlObj, canvasOptions);			
		},
		generateMaskImg: function(options){
			var _t = this, 
				mask = _t.mask,
				beforeRender = options["beforeRender"] || function(){};
				onRenderedCbk = options["onRenderedCbk"] || function(){};
			if(mask){
				this.cut({
					"htmlWapper" : _t.options["maskArea"],
					"rects" : [{"x": 0, "y": 0, "w": mask.width, "h": mask.height}],
					"beforeRender": beforeRender,
					"onRenderedCbk" : onRenderedCbk
				});
			} else {
				throw 'the mask is undefined';
			}
			
		},
		initOptions: function(options){
			var _t = this;

			for(var k in options){
				_t["options"][k] = options[k];
			}
		},
		showBtnFinish : function(){
			var _t = this, opt = _t.options;
			var btnFinish = document.createElement("button");
			btnFinish.id = "cutImg_btnFinish";
			btnFinish.innerHTML = "完成";
			setStyle(btnFinish, {
				"position": "fixed",
				"top" : "0px",
				"right" : "0px",
				"zIndex" : opt["maskZindex"] + 1,
				"padding": "5px 10px",
				"cursor": "pointer"
			});
			
			document.body.appendChild(btnFinish);
			_t.btnFinish = G(btnFinish.id);
		},
		
		"initMask": function(){
			var _t = this, 
				opt = _t.options,
				begin = _t._perBegin;
			var mask = document.createElement("canvas");
			mask.id = _t.maskId;
			mask.width = document.body.scrollWidth;
			mask.height = document.body.scrollHeight;
			setStyle(mask, {
				"position" : "absolute",
				"top" : "0px",
				"left" : "0px",
				"zIndex": opt["maskZindex"]
			});
			if(!mask.getContext){ return; }
			var ctx = mask.getContext("2d");
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(0,0,mask.width, mask.height);
			_t.maskCtx = ctx;
			addEvent(mask, "mousedown", function(e){
				_t._isDrawing = true;
				begin.x = e.layerX;
				begin.y = e.layerY;
				_t._prevRect = null;
			});
			addEvent(mask, "mousemove", function(e){
				var current = {"x" : e.layerX, "y": e.layerY};
				var rects = _t.rects;	
				if(_t._isDrawing){
					_t.drawRect(begin, current);
				} else {
					var rectIndex = _t.findRect(current);
					if(rectIndex > -1){
						var _prevMouseInRect = _t._prevMouseInRect;
						//如果在两个矩形重叠处移动，前一次鼠标位置在的矩形优先显示
						if(_prevMouseInRect != -1 && _prevMouseInRect < rects.length && _prevMouseInRect != rectIndex && _t.isInRect(current, rects[_prevMouseInRect])){
							rectIndex = _prevMouseInRect;									
						}
						_t.draw(rects[rectIndex]);
						_t.showDelete(rectIndex);
						_t._prevMouseInRect = rectIndex;
					} else {
						//如果在矩形外移动，则隐藏删除按钮
						var btnDel = G(_t.btnDelId);								
						if(btnDel){ btnDel.style.display = "none"; }						
					}
				}
			});	
			addEvent(mask,"mouseup", function(e){
				_t._isDrawing = false;
				var prev = _t._prevRect;
				if(prev){
					prev["type"] = "rect";
					//如果矩形区和其它矩形区不完全重叠，则保存
					if(_t.findRect(prev) == -1){
						delete prev["type"];
						_t.rects.push(prev);
					}
				}
			});				
			addEvent(document.body,"keyup", _t._onBodyKeyup);

			document.body.appendChild(mask);
			_t.mask = mask;	
		},
		_onBodyKeyup: function(e){
			if(e.keyCode == 27){
				CutImage.unstall();
			}
		},
		//根据点或者矩形查找,是否被某个矩形完全重叠
		findRect : function(obj){
			/* obj: {
				type:"rect" //"rect" || "pos"
			  	"x" : 0,
				"y" : 0,
				"w" : 100,
				"h" : 100"
			} */
			//var index = [];
			var rects = this.rects;
			for(var i = 0 , l = rects.length; i < l; i ++){
				var rect = rects[i];
				if(obj.type == "rect"){
					var isIn = obj.x > rect.x;
					isIn = isIn && ((obj.x + obj.w) < (rect.x + rect.w));
					isIn = isIn && (obj.y > rect.y);
					isIn = isIn && ((obj.y + obj.h) < (rect.y + rect.h));
					if(isIn){
						return i;
						break;
					}
				} else {
					if(this.isInRect(obj, rect)){
						return i;
						break;
					}
				}						
			}
			return -1;
		},
		isInRect : function(pos, rect){
			if(pos.x > rect.x && pos.x < (rect.x + rect.w) && pos.y > rect.y && pos.y < (rect.y + rect.h)){
				return true;
			}
			return false;
		},
		showDelete : function(rectIndex){
			var _t = this;
			var rect = _t.rects[rectIndex];
			var btnDel = document.createElement("div");
			setStyle(btnDel,  {
				"backgroundColor": "#cc0000",
				"color": "#fff",
				"borderWidth": "0px",
				"borderStyle" :"none",
				"borderRadius" : "50%",
				"width" : "16px",
				"height" : "16px",
				"lineHeight" : "16px",								
				"padding" : "0px",
				"margin" : "0px",
				"textAlign" :"center",
				"fontFamily" : "Arial",
				"fontSize" : "12px",
				"cursor": "pointer",
				"position" : "absolute",
				"top" : (rect["y"] - 6) + "px",
				"left" : (rect["x"] + rect["w"] - 10) + "px",
				"zIndex": 100
			});
			btnDel.id = _t.btnDelId;
			btnDel.innerHTML = "x";
			btnDel.setAttribute("rectindex", rectIndex);
			btnDel.onclick = function(e){						
				_t.rects.splice(rectIndex,1);
				_t.removeBtnDel();
				_t.redraw();
			};
			_t.removeBtnDel();
			document.body.appendChild(btnDel);
		},
		removeBtnDel: function(){
			var btnDel = G(this.btnDelId);
			if(btnDel){
				btnDel.parentNode.removeChild(btnDel);
			}
		},
		drawRect : function(begin, end){
			var _t = this;		
			var size = {"w" : Math.abs(end.x - begin.x), "h": Math.abs(end.y - begin.y)};
			var lineWidth = _t.lineWidth;
			var newBegin = {"x": begin.x, "y" : begin.y};
			var prev = _t._prevRect;
			if(end.x < begin.x){ newBegin.x = end.x; }
			if(end.y < begin.y){ newBegin.y = end.y; }
			
			if(prev){
				_t.clearArea(prev);
				//矩形缩小时要检查是否和其它矩形有重叠区域
				if(size.w < prev.w || size.h < prev.h){
					_t.redraw();
					/*
					var tmpPos = [];							
					tmpPos.push(newBegin);
					tmpPos.push({"x" : newBegin.x + size.w , "y" : newBegin.y});
					tmpPos.push({"x" : newBegin.x + size.w , "y" : newBegin.y + size.h});
					tmpPos.push({"x" : newBegin.x , "y" : newBegin.y + size.h});
					for(var i = 0, l = tmpPos.length; i < l; i ++){
						var rectIndex = findRect(tmpPos[i]);
						if(rectIndex != -1){
							draw(rects[rectIndex]);
						}
					}	*/					
				}
			}

			prev = {"x": newBegin.x, "y" : newBegin.y, "w": size.w, "h": size.h};
			_t.draw(prev);
			_t._prevRect = prev;
		},
		clearArea : function(rect){
			var ctx = this.maskCtx,
				lineWidth = this.lineWidth;
			ctx.clearRect(rect.x - lineWidth / 2, rect.y - lineWidth / 2, rect.w + lineWidth, rect.h + lineWidth);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(rect.x - lineWidth / 2, rect.y - lineWidth / 2, rect.w + lineWidth, rect.h + lineWidth);
		},
		redraw : function(){
			var _t = this,
				rects = _t.rects,
				mask = _t.mask;
			_t.clearArea({"x" : 0, "y" : 0, "w": mask.width, "h": mask.height});
			for(var i = 0 , l = rects.length; i < l; i ++){
				_t.clearArea(rects[i]);
				_t.draw(rects[i]);
			}
		},
		draw: function(rect){					
			if(rect.w < 5 && rect.h < 5){ return; }
			var ctx = this.maskCtx;
			ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
			ctx.lineWidth = this.lineWidth;
			ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
		},

		unstall: function(){
			var _t = this, opt = _t.options;
			var tmpMask = G(this.maskId);
			if(tmpMask){
				document.body.removeChild(tmpMask);
			}	
			
			if(opt["showFinish"] && (!opt["btnFinish"])){
				var btnFinish = _t.btnFinish;
				if(btnFinish){
					btnFinish.parentNode.removeChild(btnFinish);
				}
			}
			this.removeBtnDel();
			removeEvent(document.body,"keyup", _t._onBodyKeyup);
		}
	};

	return _cutImg;
})();
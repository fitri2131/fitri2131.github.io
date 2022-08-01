(function () {
	'use strict';
    let words = {};
    let obj = {};
    let str = '';
    $.get("https://kamus-69b35-default-rtdb.asia-southeast1.firebasedatabase.app/kamus.json", function(data, status){
        for(const key in data) {
            words[key] = data[key];
        }
        const keys = Object.keys(words);
        for(var i=0; i<3; i++) {
            const key = keys[Math.floor(Math.random() * Object.keys(words).length)];
            obj[key] = words[key];
            str += words[key].kata + ',';
        }
        var keywords = document.querySelector('#keywords');
        keywords.value = str;
        str = str.slice(0,-1);
        
        var sstorage;
        try {
            sstorage = sessionStorage;
        }
        catch(e) {
            // if serving directly from a file
            var sdata = {};
            sstorage = {
                getItem: function(k) {
                    return sdata[k];
                },
                setItem: function(k, v) {
                    sdata[k] = v;
                },
                clear: function() {
                    sdata = {};
                }
            };
        }
        var aho;
        var text = document.querySelector('textarea');
        var keywords = document.querySelector('#keywords');
        var pre = document.querySelector('#text-pre');
        var btn = document.querySelector('button');
        var currentS = document.querySelector('#current-state');
        var found = document.querySelector('#found');
        var range = document.querySelector('input[type="range"]');
        var failure = document.querySelector('#failure-function');
        var output = document.querySelector('#output-function');
        var prev = null;
        var allFound = [];
    
        var fillPre = function(v) {
            pre.innerHTML = v.replace(/(.)/g, '<span>$1</span>');
        };
    
        var restart = function() {
            if (prev) {
                prev.style('fill', '');
            }
            prev = null;
            allFound = [];
            text.value = (sstorage.getItem('text') || text.value || 'ushers').trim();
            currentS.innerHTML = '';
            found.innerHTML = '';
    
            fillPre(text.value);
            aho = new AhoCorasick(obj);
            draw(aho);
        };
    
        fillPre(text.value);
        var _kptimer = null;
        text.addEventListener('keydown', function() {
            window.clearTimeout(_kptimer);
            _kptimer = setTimeout(function() {
                sstorage.setItem('text', text.value);
                fillPre(text.value);
            }, 250);
        });
    
        var _wordstimer = null;
        keywords.addEventListener('keydown', function() {
            window.clearTimeout(_wordstimer);
            _wordstimer = setTimeout(function() {
                var v = keywords.value.trim();
                sstorage.setItem('keywords', v);
                restart();
            }, 250);
        });
    
        var drv = sstorage.getItem('range');
        if (drv) {
            range.value = drv;
        }
        range.addEventListener('change', function() {
            sstorage.setItem('range', range.value)
        });
    
        var _fillNode = function(el, data) {
            prev = el;
            el.style('fill', 'green');
    
            var l = pre.querySelector(':nth-child(' + (data.index + 1) + ')');
            if (!data.result) {
                l.className = 'fail';
            }
            else {
                l.className = 'match';
                if (data.found.length) {
                    allFound.push(data.found);
    
    
                    var html = allFound.map(function(f) {
                        return f[0] + ',' + JSON.stringify(f[1]);
                    }).join('; ');
    
                    found.innerHTML = html;
                }
            }
        }
    
        var fillNode = function(data) {
            var el = d3.select('#node-' + data.state + ' circle');
            if (prev) {
                prev.style('fill', '');
                if (el.id === prev.id) {
                    setTimeout(function() {
                        _fillNode(el, data);
                    }, 100);
                    return;
                }
            }
    
            _fillNode(el, data);
        };
    
        btn.addEventListener('click', function() {
            aho.search(text.value);
        });
    
        var running = function(s) {
            [text, btn, keywords, range].forEach(function(el) {
                s ? el.setAttribute('disabled', 'disabled') : el.removeAttribute('disabled');
            });
        };
    
        AhoCorasick.prototype.search = function(string) {
            restart();
    
            var state = 0;
            var results = [];
    
            var time = 0;
            var rv = range.value * 10;
            var c = function(data) {
                time += rv;
                setTimeout(function() {
                    if (data.state === null) {
                        running(false);
                    }
                    else {
                        currentS.innerHTML = data.state;
                        fillNode(data);
                    }
                }, time);
            };
    
            fillNode({state: state, index: 0});
            running(true);
            for (var i=0; i<string.length; i++) {
                var l = string[i];
                while (state > 0 && !(l in this.gotoFn[state])) {
                    state = this.failure[state];
                    c({state: state, token: l, result: 0, found: [], index: i});
                }
    
                if (!(l in this.gotoFn[state])) {
                    c({state: state, token: l, result: 0, found: [], index: i});
                    continue;
                }
    
                state = this.gotoFn[state][l];
    
                if (this.output[state].length) {
                    let foundStr = '';
                    let found = [];
                    for(var j=0; j<this.output[state].length; j++) {
                        foundStr += words[this.output[state][j]].kata + ", ";
                        results.push(words[this.output[state][j]]);
                    }
                    if((i+1) == string.length) {
                        found = [i, foundStr.slice(0,-1)]
                    }
                    c({state: state, token: l, result: 2, found: found, index: i});
                }
                else {
                    c({state: state, token: l, result: 1, found: [], index: i});
                }
            }
            c({state: null});
    
            return results;
        };
    
        var draw = function(aho) {
    
            // objects are unordered collections
            var failureArr = [];
            for (var i in aho.failure) {
                failureArr.push(i);
            }
            var failureHTMLHead = ['<th>i</th>'];
            var failureHTMLBody = ['<td>f(i)</td>'];
            failureArr.sort().forEach(function(i) {
                failureHTMLHead.push('<th>' + i + '</th>');
                failureHTMLBody.push('<td>' + aho.failure[i] + '</td>');
            });
            failure.querySelector('thead').innerHTML =  '<tr>' + failureHTMLHead.join('') + '</tr>';
            failure.querySelector('tbody').innerHTML = '<tr>' + failureHTMLBody.join('') + '</tr>';
    
            var outputArr = [];
            for (var i in aho.output) {
                if (aho.output[i].length) {
                    outputArr.push(i);
                }
            }
            var outputHtmlBody = [];
            outputArr.sort().forEach(function(i) {
                outputHtmlBody.push('<tr><td>' + i + '</td>')
                outputHtmlBody.push('<td>{' + aho.output[i].map(function(j) {
                    return j;
                }).join(', ') + '}</td></tr>')
            });
            output.querySelector('thead').innerHTML =  '<tr><th>i</th><th>output(i)</th></tr>';
            output.querySelector('tbody').innerHTML = outputHtmlBody.join('');
    
            var g = new dagreD3.graphlib.Graph();
    
            // Set an object for the graph label
            g.setGraph({
                rankdir: "LR",
                marginx: 20,
                marginy: 20
            });
    
            g.setDefaultEdgeLabel({});
    
            g.setEdge(0, 0, {label: '¬ {' + Object.keys(aho.gotoFn[0]).join(',') + '}', id: 'edge-0-0'});
            for (var state in aho.gotoFn) {
                var transitions = aho.gotoFn[state];
                g.setNode(state, {
                    label: state,
                    shape: 'circle',
                    id: 'node-' + state
                });
                for (var symbol in transitions) {
                    var targetState = transitions[symbol];
                    g.setEdge(
                        state, targetState, {
                            label: symbol,
                            id: 'edge-' + state + '-' + targetState
                        }
                    );
                }
            }
    
            var svg = d3.select("svg"),
                inner = svg.select("g"),
                zoom = d3.zoom().on("zoom", function () {
                    inner.attr("transform", d3.event.transform);
                });
            svg.call(zoom);
    
            svg.append('text').attr('x', 20).attr('y', 20).text('goto function');
    
            dagreD3.render(g);
    
            var render = new dagreD3.render();
            inner.call(render, g);
    
            // Zoom and scale to fit
            var graphWidth = g.graph().width + 80;
            var graphHeight = g.graph().height + 40;
            var width = parseInt(svg.style("width").replace(/px/, ""));
            var height = parseInt(svg.style("height").replace(/px/, ""));
            var zoomScale = Math.min(width / graphWidth, height / graphHeight);
            var translateX = (width / 2) - ((graphWidth * zoomScale) / 2)
            var translateY = (height / 2) - ((graphHeight * zoomScale) / 2);
            var svgZoom = svg;
            svgZoom.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(zoomScale));
        };
    
        restart();
    });
})();

(function() {
    'use strict';
    var AhoCorasick = function(keywords) {
        this._buildTables(keywords);
    };

    AhoCorasick.prototype._buildTables = function(keywords) {
        var gotoFn = {
            0: {}
        };
        var output = {};
        var state = 0;
        for (const key in keywords) {
            if (Object.hasOwnProperty.call(keywords, key)) {
                let curr = 0;
                const word = keywords[key].kata.toLowerCase();
                const id = keywords[key].id;
                for (let i = 0; i < word.length; i++) {
                    const l = word[i];
                    if(gotoFn[curr] && l in gotoFn[curr]) {
                        curr = gotoFn[curr][l];
                        output[curr].push(id);
                    } else {
                        state++;
                        gotoFn[curr][l] = state;
                        gotoFn[state] = {};
                        curr = state;
                        output[state] = [id];
                    }
                }
            }
        }
        
        var failure = {};
        var xs = [];
        // f(s) = 0 for all states of depth 1 (the ones from which the 0 state can transition to)
        for (var l in gotoFn[0]) {
            var state = gotoFn[0][l];
            failure[state] = 0;
            xs.push(state);
        }

        while (xs.length) {
            var r = xs.shift();
            for (var l in gotoFn[r]) {
                var s = gotoFn[r][l];
                xs.push(s);
                
                // set state = f(r)
                var state = failure[r];
                while(state > 0 && !(l in gotoFn[state])) {
                    state = failure[state];
                }
                
                if (l in gotoFn[state]) {
                    var fs = gotoFn[state][l];
                    failure[s] = fs;
                    // output[s] = output[s].concat(output[fs]);
                }
                else {
                    failure[s] = 0;
                }
            }
        }
        
        this.gotoFn = gotoFn;
        this.output = output;
        this.failure = failure;
    };

    AhoCorasick.prototype.search = function(string) {
        var state = 0;
        var results = [];
        for (var i=0; i<string.length; i++) {
            var l = string[i];
            while (state > 0 && !(l in this.gotoFn[state])) {
                return [];
                // state = this.failure[state];
            }
            if (!(l in this.gotoFn[state])) {
                continue;
            }
            
            state = this.gotoFn[state][l];
            if((i+1) == string.length) {
                if (this.output[state].length) {
                    var foundStrs = this.output[state];
                    results = foundStrs;
                }
            }
        }
        return results;
    };

    if (typeof module !== 'undefined') {
        module.exports = AhoCorasick;
    }
    else {
        window.AhoCorasick = AhoCorasick;
    }
})();

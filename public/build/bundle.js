
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var info = {
    	title: "Monty Bojangles chocolates",
    	type: "v5"
    };
    var data = [
    	{
    		name: "berry-bubbly",
    		img: "berry-bubbly.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/berry-bubbly-1.png"
    	},
    	{
    		name: "choccy-scoffy",
    		img: "choccy-scoffy.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/choccy-scoffy.png"
    	},
    	{
    		name: "cococrush",
    		img: "cococrush.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/cococrush.png"
    	},
    	{
    		name: "cookie-moon",
    		img: "cookie-moon.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/cookie-moon.png"
    	},
    	{
    		name: "flutter-scotch",
    		img: "flutter-scotch.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/flutter-scotch.png"
    	},
    	{
    		name: "Orange Angelical",
    		img: "orange-angelical.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/flutter-scotch.png"
    	},
    	{
    		name: "Pistachio Marooned",
    		img: "pistachio-marooned.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/pistachio-marooned.png"
    	},
    	{
    		name: "Popcorn Carousel",
    		img: "popcorn-carousel.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/popcorn-carousel_new_correctedtop.png"
    	},
    	{
    		name: "Ruby Fruit Sunday",
    		img: "ruby-fruit-sunday.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/ruby-fruit-sunday.png"
    	},
    	{
    		name: "Scrumple Nutty",
    		img: "scrumple-nutty.png",
    		url: "https://montybojangles.com/wp-content/uploads/2019/01/scrumple-nutty.pn"
    	}
    ];
    var alist = {
    	info: info,
    	data: data
    };

    var aList = /*#__PURE__*/Object.freeze({
        __proto__: null,
        info: info,
        data: data,
        'default': alist
    });

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let state = {};
    let timerId;
    let statusHandler = {
        PLAYING: function () {
            timerId = setInterval(function () {
                counting();
            }, 1000);
        },

        PASS: function () {
            clearInterval(timerId);
            updateHighestSpeed();
            toggleEnd(true);
            //commit('updateHighestSpeed');
            //commit('toggleNameInput', true);
        }
    };


    const { subscribe: subscribe$1, set, update: update$1 } = writable(state);

    function reset(newState) {
        state.leftMatched = newState.leftMatched;
        state.highestSpeed = newState.highestSpeed;
        state.status = newState.status;
        state.cards = newState.cards;
        state.elapsedMs = newState.elapsedMs;
        state.displayRank = newState.displayRank;
        state.displayNameInput = newState.displayNameInput;
        state.ranks = newState.ranks;
        state.userName = newState.userName;
        state.displayEnd = newState.displayEnd;
        set(state);
    }

    function updateStatus(newStatus) {
        state.status = newStatus;
        set(state);
        statusHandler[newStatus]();
    }

    function decreaseMatch() {
        state.leftMatched--;
        set(state);
    }

    function flip(card) {
        var c = state.cards.find(cc => cc == card);
        c.flipped = !c.flipped;
        set(state);
    }

    function flipCards(cards) {
        state.cards
            .filter(cc => cards.indexOf(cc) >= 0)
            .forEach(cc => {
                cc.flipped = !cc.flipped;
            });
        set(state);
    }

    function counting() {
        state.elapsedMs++;
        set(state);
    }

    function updateHighestSpeed() {
        if (!localStorage.getItem('highestSpeed')) {
            localStorage.setItem('highestSpeed', state.elapsedMs);
            state.highestSpeed = state.elapsedMs;
            set(state);
            return;
        }

        if (localStorage.getItem('highestSpeed') > state.elapsedMs) {
            localStorage.setItem('highestSpeed', state.elapsedMs);
            state.highestSpeed = state.elapsedMs;
            set(state);
            return;
        }
    }


    function toggleEnd(boo) {
        state.displayEnd = boo;
        set(state);
    }

    function updateUsername(name) {
        localStorage.setItem('userName', name);
        state.userName = name;
        set(state);
    }


    function flipCard(card) {
        console.log(card);
        flip(card);
    }

    function match() {
        decreaseMatch();
    }


    var store = {
        subscribe: subscribe$1,
        reset,
        decreaseMatch,
        flip,
        counting,
        updateHighestSpeed,

        toggleEnd,
        updateUsername,

        // actions
        flipCard,
        flipCards,
        match,
        updateStatus,
    };

    /* src/components/dashboard/logo.svelte generated by Svelte v3.24.0 */

    const file = "src/components/dashboard/logo.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let a;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			a = element("a");
    			a.textContent = "Memory";
    			attr_dev(a, "href", "https://github.com/freshteapot/svelte-memory-game");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-1izq7fx");
    			add_location(a, file, 39, 2, 569);
    			attr_dev(h1, "class", "logo svelte-1izq7fx");
    			add_location(h1, file, 38, 0, 549);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Logo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Logo", $$slots, []);
    	return [];
    }

    class Logo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logo",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/dashboard/match_info.svelte generated by Svelte v3.24.0 */
    const file$1 = "src/components/dashboard/match_info.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let span;
    	let t1;
    	let h2;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Pairs Left To Match";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*leftMatched*/ ctx[0]);
    			attr_dev(span, "class", "svelte-py8w4a");
    			add_location(span, file$1, 66, 2, 1016);
    			attr_dev(h2, "class", "svelte-py8w4a");
    			add_location(h2, file$1, 67, 2, 1051);
    			attr_dev(div, "class", "board svelte-py8w4a");
    			add_location(div, file$1, 65, 0, 994);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*leftMatched*/ 1) set_data_dev(t2, /*leftMatched*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { leftMatched = 8 } = $$props;
    	const writable_props = ["leftMatched"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Match_info> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Match_info", $$slots, []);

    	$$self.$set = $$props => {
    		if ("leftMatched" in $$props) $$invalidate(0, leftMatched = $$props.leftMatched);
    	};

    	$$self.$capture_state = () => ({ store, leftMatched });

    	$$self.$inject_state = $$props => {
    		if ("leftMatched" in $$props) $$invalidate(0, leftMatched = $$props.leftMatched);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [leftMatched];
    }

    class Match_info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { leftMatched: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Match_info",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get leftMatched() {
    		throw new Error("<Match_info>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leftMatched(value) {
    		throw new Error("<Match_info>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/dashboard/score.svelte generated by Svelte v3.24.0 */

    const file$2 = "src/components/dashboard/score.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let span;
    	let t1;
    	let h2;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			span.textContent = "Highest Speed";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(/*highestSpeed*/ ctx[0]);
    			attr_dev(span, "class", "svelte-cm6sow");
    			add_location(span, file$2, 54, 2, 820);
    			attr_dev(h2, "class", "svelte-cm6sow");
    			add_location(h2, file$2, 55, 2, 849);
    			attr_dev(div, "class", "score svelte-cm6sow");
    			add_location(div, file$2, 53, 0, 798);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(h2, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*highestSpeed*/ 1) set_data_dev(t2, /*highestSpeed*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { highestSpeed } = $$props;
    	const writable_props = ["highestSpeed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Score> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Score", $$slots, []);

    	$$self.$set = $$props => {
    		if ("highestSpeed" in $$props) $$invalidate(0, highestSpeed = $$props.highestSpeed);
    	};

    	$$self.$capture_state = () => ({ highestSpeed });

    	$$self.$inject_state = $$props => {
    		if ("highestSpeed" in $$props) $$invalidate(0, highestSpeed = $$props.highestSpeed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [highestSpeed];
    }

    class Score extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { highestSpeed: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Score",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*highestSpeed*/ ctx[0] === undefined && !("highestSpeed" in props)) {
    			console.warn("<Score> was created without expected prop 'highestSpeed'");
    		}
    	}

    	get highestSpeed() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highestSpeed(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/dashboard/dashboard.svelte generated by Svelte v3.24.0 */
    const file$3 = "src/components/dashboard/dashboard.svelte";

    // (40:0) {#if $store.displayEnd}
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Try again?";
    			attr_dev(button, "class", "try-again svelte-1u6v0yu");
    			add_location(button, file$3, 41, 4, 805);
    			attr_dev(div, "class", "status-bar svelte-1u6v0yu");
    			add_location(div, file$3, 40, 2, 776);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onTryAgain*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $store.displayEnd}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let logo;
    	let t0;
    	let matchinfo;
    	let updating_leftMatched;
    	let t1;
    	let score;
    	let updating_highestSpeed;
    	let t2;
    	let if_block_anchor;
    	let current;
    	logo = new Logo({ $$inline: true });

    	function matchinfo_leftMatched_binding(value) {
    		/*matchinfo_leftMatched_binding*/ ctx[4].call(null, value);
    	}

    	let matchinfo_props = {};

    	if (/*leftMatched*/ ctx[0] !== void 0) {
    		matchinfo_props.leftMatched = /*leftMatched*/ ctx[0];
    	}

    	matchinfo = new Match_info({ props: matchinfo_props, $$inline: true });
    	binding_callbacks.push(() => bind(matchinfo, "leftMatched", matchinfo_leftMatched_binding));

    	function score_highestSpeed_binding(value) {
    		/*score_highestSpeed_binding*/ ctx[5].call(null, value);
    	}

    	let score_props = {};

    	if (/*highestSpeed*/ ctx[1] !== void 0) {
    		score_props.highestSpeed = /*highestSpeed*/ ctx[1];
    	}

    	score = new Score({ props: score_props, $$inline: true });
    	binding_callbacks.push(() => bind(score, "highestSpeed", score_highestSpeed_binding));
    	let if_block = /*$store*/ ctx[2].displayEnd && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(logo.$$.fragment);
    			t0 = space();
    			create_component(matchinfo.$$.fragment);
    			t1 = space();
    			create_component(score.$$.fragment);
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div, "class", "status-bar svelte-1u6v0yu");
    			add_location(div, file$3, 33, 0, 643);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(logo, div, null);
    			append_dev(div, t0);
    			mount_component(matchinfo, div, null);
    			append_dev(div, t1);
    			mount_component(score, div, null);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const matchinfo_changes = {};

    			if (!updating_leftMatched && dirty & /*leftMatched*/ 1) {
    				updating_leftMatched = true;
    				matchinfo_changes.leftMatched = /*leftMatched*/ ctx[0];
    				add_flush_callback(() => updating_leftMatched = false);
    			}

    			matchinfo.$set(matchinfo_changes);
    			const score_changes = {};

    			if (!updating_highestSpeed && dirty & /*highestSpeed*/ 2) {
    				updating_highestSpeed = true;
    				score_changes.highestSpeed = /*highestSpeed*/ ctx[1];
    				add_flush_callback(() => updating_highestSpeed = false);
    			}

    			score.$set(score_changes);

    			if (/*$store*/ ctx[2].displayEnd) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo.$$.fragment, local);
    			transition_in(matchinfo.$$.fragment, local);
    			transition_in(score.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo.$$.fragment, local);
    			transition_out(matchinfo.$$.fragment, local);
    			transition_out(score.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(logo);
    			destroy_component(matchinfo);
    			destroy_component(score);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $store;
    	validate_store(store, "store");
    	component_subscribe($$self, store, $$value => $$invalidate(2, $store = $$value));
    	const dispatch = createEventDispatcher();
    	let { leftMatched } = $$props;
    	let { highestSpeed } = $$props;

    	function onTryAgain() {
    		dispatch("restart");
    	}

    	const writable_props = ["leftMatched", "highestSpeed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dashboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dashboard", $$slots, []);

    	function matchinfo_leftMatched_binding(value) {
    		leftMatched = value;
    		$$invalidate(0, leftMatched);
    	}

    	function score_highestSpeed_binding(value) {
    		highestSpeed = value;
    		$$invalidate(1, highestSpeed);
    	}

    	$$self.$set = $$props => {
    		if ("leftMatched" in $$props) $$invalidate(0, leftMatched = $$props.leftMatched);
    		if ("highestSpeed" in $$props) $$invalidate(1, highestSpeed = $$props.highestSpeed);
    	};

    	$$self.$capture_state = () => ({
    		store,
    		Logo,
    		MatchInfo: Match_info,
    		Score,
    		createEventDispatcher,
    		dispatch,
    		leftMatched,
    		highestSpeed,
    		onTryAgain,
    		$store
    	});

    	$$self.$inject_state = $$props => {
    		if ("leftMatched" in $$props) $$invalidate(0, leftMatched = $$props.leftMatched);
    		if ("highestSpeed" in $$props) $$invalidate(1, highestSpeed = $$props.highestSpeed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		leftMatched,
    		highestSpeed,
    		$store,
    		onTryAgain,
    		matchinfo_leftMatched_binding,
    		score_highestSpeed_binding
    	];
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { leftMatched: 0, highestSpeed: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dashboard",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*leftMatched*/ ctx[0] === undefined && !("leftMatched" in props)) {
    			console.warn("<Dashboard> was created without expected prop 'leftMatched'");
    		}

    		if (/*highestSpeed*/ ctx[1] === undefined && !("highestSpeed" in props)) {
    			console.warn("<Dashboard> was created without expected prop 'highestSpeed'");
    		}
    	}

    	get leftMatched() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set leftMatched(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highestSpeed() {
    		throw new Error("<Dashboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highestSpeed(value) {
    		throw new Error("<Dashboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/card/card.svelte generated by Svelte v3.24.0 */

    const { console: console_1 } = globals;
    const file$4 = "src/components/card/card.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t;
    	let img1;
    	let img1_src_value;
    	let div0_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t = space();
    			img1 = element("img");
    			attr_dev(img0, "class", "front svelte-1x3yl3b");
    			if (img0.src !== (img0_src_value = /*option*/ ctx[0].img)) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file$4, 96, 4, 1747);
    			attr_dev(img1, "class", "back svelte-1x3yl3b");
    			if (img1.src !== (img1_src_value = "data/back.png")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file$4, 98, 4, 1791);
    			attr_dev(div0, "class", div0_class_value = "card " + /*flipped*/ ctx[1] + " svelte-1x3yl3b");
    			add_location(div0, file$4, 95, 2, 1714);
    			attr_dev(div1, "class", "container svelte-1x3yl3b");
    			add_location(div1, file$4, 94, 0, 1672);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t);
    			append_dev(div0, img1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*flip*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*option*/ 1 && img0.src !== (img0_src_value = /*option*/ ctx[0].img)) {
    				attr_dev(img0, "src", img0_src_value);
    			}

    			if (dirty & /*flipped*/ 2 && div0_class_value !== (div0_class_value = "card " + /*flipped*/ ctx[1] + " svelte-1x3yl3b")) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { key } = $$props;
    	let { option = { flipped: false, name: "", img: "" } } = $$props;

    	function flip() {
    		// action flipcard?
    		if (option.flipped) {
    			return;
    		}

    		//option.flipped = !option.flipped;
    		//this.flipCard(this.option);
    		store.flipCard(option);

    		//this.$emit('flipped', this.option);
    		dispatch("flipped", option);
    	}

    	console.log(key);
    	console.log(option);
    	const writable_props = ["key", "option"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Card", $$slots, []);

    	$$self.$set = $$props => {
    		if ("key" in $$props) $$invalidate(3, key = $$props.key);
    		if ("option" in $$props) $$invalidate(0, option = $$props.option);
    	};

    	$$self.$capture_state = () => ({
    		store,
    		createEventDispatcher,
    		dispatch,
    		key,
    		option,
    		flip,
    		flipped
    	});

    	$$self.$inject_state = $$props => {
    		if ("key" in $$props) $$invalidate(3, key = $$props.key);
    		if ("option" in $$props) $$invalidate(0, option = $$props.option);
    		if ("flipped" in $$props) $$invalidate(1, flipped = $$props.flipped);
    	};

    	let flipped;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*option*/ 1) {
    			 $$invalidate(1, flipped = option.flipped ? "flipped" : "");
    		}
    	};

    	return [option, flipped, flip, key];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { key: 3, option: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*key*/ ctx[3] === undefined && !("key" in props)) {
    			console_1.warn("<Card> was created without expected prop 'key'");
    		}
    	}

    	get key() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get option() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set option(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const STATUS = {
        READY: 'READY',
        PLAYING: 'PLAYING',
        PASS: 'PASS'
    };

    function copyObject(item) {
        return JSON.parse(JSON.stringify(item))
    }

    /* src/components/card/chessboard.svelte generated by Svelte v3.24.0 */

    const { console: console_1$1 } = globals;
    const file$5 = "src/components/card/chessboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (102:2) {#each cards as card, index}
    function create_each_block(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				key: /*index*/ ctx[6],
    				option: /*card*/ ctx[4]
    			},
    			$$inline: true
    		});

    	card.$on("flipped", /*onFlipped*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};
    			if (dirty & /*cards*/ 1) card_changes.option = /*card*/ ctx[4];
    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(102:2) {#each cards as card, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	let each_value = /*cards*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "chessboard svelte-1t6dxh4");
    			add_location(div, file$5, 100, 0, 2139);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cards, onFlipped*/ 3) {
    				each_value = /*cards*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $store;
    	validate_store(store, "store");
    	component_subscribe($$self, store, $$value => $$invalidate(3, $store = $$value));
    	let { cards = [] } = $$props;
    	let { lastCard = null } = $$props;

    	function onFlipped(e) {
    		const card = e.detail;

    		if ($store.status === STATUS.READY) {
    			store.updateStatus(STATUS.PLAYING);
    		}

    		if (!lastCard) {
    			$$invalidate(2, lastCard = card);
    			return;
    		}

    		if (lastCard !== card && lastCard.name === card.name) {
    			console.log("Matched");
    			$$invalidate(2, lastCard = null);
    			store.match();
    			return $store.leftMatched || store.updateStatus(STATUS.PASS);
    		}

    		const oldCard = lastCard;
    		$$invalidate(2, lastCard = null);

    		setTimeout(
    			() => {
    				store.flipCards([oldCard, card]);
    			},
    			1000
    		);
    	}

    	const writable_props = ["cards", "lastCard"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Chessboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Chessboard", $$slots, []);

    	$$self.$set = $$props => {
    		if ("cards" in $$props) $$invalidate(0, cards = $$props.cards);
    		if ("lastCard" in $$props) $$invalidate(2, lastCard = $$props.lastCard);
    	};

    	$$self.$capture_state = () => ({
    		store,
    		Card,
    		STATUS,
    		copyObject,
    		cards,
    		lastCard,
    		onFlipped,
    		$store
    	});

    	$$self.$inject_state = $$props => {
    		if ("cards" in $$props) $$invalidate(0, cards = $$props.cards);
    		if ("lastCard" in $$props) $$invalidate(2, lastCard = $$props.lastCard);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cards, onFlipped, lastCard];
    }

    class Chessboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { cards: 0, lastCard: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chessboard",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get cards() {
    		throw new Error("<Chessboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cards(value) {
    		throw new Error("<Chessboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lastCard() {
    		throw new Error("<Chessboard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lastCard(value) {
    		throw new Error("<Chessboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/footer/play_status.svelte generated by Svelte v3.24.0 */
    const file$6 = "src/components/footer/play_status.svelte";

    // (31:2) {#if status === STATUS.PLAYING}
    function create_if_block$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Playing";
    			add_location(span, file$6, 31, 4, 619);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(31:2) {#if status === STATUS.PLAYING}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let if_block = /*status*/ ctx[0] === STATUS.PLAYING && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(/*elapsedMs*/ ctx[1]);
    			t2 = text(" s");
    			attr_dev(span, "class", "elapsed svelte-ymjazc");
    			add_location(span, file$6, 34, 2, 651);
    			attr_dev(div, "class", "status-footer svelte-ymjazc");
    			add_location(div, file$6, 28, 0, 552);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*status*/ ctx[0] === STATUS.PLAYING) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*elapsedMs*/ 2) set_data_dev(t1, /*elapsedMs*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { status = STATUS.READY } = $$props;
    	let { elapsedMs = "10" } = $$props;
    	const writable_props = ["status", "elapsedMs"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Play_status> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Play_status", $$slots, []);

    	$$self.$set = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    		if ("elapsedMs" in $$props) $$invalidate(1, elapsedMs = $$props.elapsedMs);
    	};

    	$$self.$capture_state = () => ({ STATUS, status, elapsedMs });

    	$$self.$inject_state = $$props => {
    		if ("status" in $$props) $$invalidate(0, status = $$props.status);
    		if ("elapsedMs" in $$props) $$invalidate(1, elapsedMs = $$props.elapsedMs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [status, elapsedMs];
    }

    class Play_status extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { status: 0, elapsedMs: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Play_status",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get status() {
    		throw new Error("<Play_status>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set status(value) {
    		throw new Error("<Play_status>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elapsedMs() {
    		throw new Error("<Play_status>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elapsedMs(value) {
    		throw new Error("<Play_status>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const shuffle = function (arr) {

        let newArr = [...arr];
        newArr.push(...arr.map(item => {
            return copyObject(item);
        }));

        for (let i = newArr.length; i; i -= 1) {
            let j = Math.floor(Math.random() * i);
            let x = newArr[i - 1];
            newArr[i - 1] = newArr[j];
            newArr[j] = x;
        }
        return newArr;
    };

    /* src/components/game.svelte generated by Svelte v3.24.0 */
    const file$7 = "src/components/game.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let dashboard;
    	let t0;
    	let chessboard;
    	let t1;
    	let playstatus;
    	let current;

    	dashboard = new Dashboard({
    			props: {
    				leftMatched: /*$store*/ ctx[0].leftMatched,
    				highestSpeed: /*$store*/ ctx[0].highestSpeed
    			},
    			$$inline: true
    		});

    	dashboard.$on("restart", /*triggerRestart*/ ctx[1]);

    	chessboard = new Chessboard({
    			props: { cards: /*$store*/ ctx[0].cards },
    			$$inline: true
    		});

    	playstatus = new Play_status({
    			props: {
    				status: /*$store*/ ctx[0].status,
    				elapsedMs: /*$store*/ ctx[0].elapsedMs
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(dashboard.$$.fragment);
    			t0 = space();
    			create_component(chessboard.$$.fragment);
    			t1 = space();
    			create_component(playstatus.$$.fragment);
    			attr_dev(div, "class", "game-panel svelte-f6ln3k");
    			add_location(div, file$7, 57, 0, 1294);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(dashboard, div, null);
    			append_dev(div, t0);
    			mount_component(chessboard, div, null);
    			append_dev(div, t1);
    			mount_component(playstatus, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const dashboard_changes = {};
    			if (dirty & /*$store*/ 1) dashboard_changes.leftMatched = /*$store*/ ctx[0].leftMatched;
    			if (dirty & /*$store*/ 1) dashboard_changes.highestSpeed = /*$store*/ ctx[0].highestSpeed;
    			dashboard.$set(dashboard_changes);
    			const chessboard_changes = {};
    			if (dirty & /*$store*/ 1) chessboard_changes.cards = /*$store*/ ctx[0].cards;
    			chessboard.$set(chessboard_changes);
    			const playstatus_changes = {};
    			if (dirty & /*$store*/ 1) playstatus_changes.status = /*$store*/ ctx[0].status;
    			if (dirty & /*$store*/ 1) playstatus_changes.elapsedMs = /*$store*/ ctx[0].elapsedMs;
    			playstatus.$set(playstatus_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dashboard.$$.fragment, local);
    			transition_in(chessboard.$$.fragment, local);
    			transition_in(playstatus.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dashboard.$$.fragment, local);
    			transition_out(chessboard.$$.fragment, local);
    			transition_out(playstatus.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(dashboard);
    			destroy_component(chessboard);
    			destroy_component(playstatus);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $store;
    	validate_store(store, "store");
    	component_subscribe($$self, store, $$value => $$invalidate(0, $store = $$value));
    	let { gameData = [{ name: "", img: "" }] } = $$props;

    	function restartGame() {
    		return {
    			leftMatched: gameData.length,
    			highestSpeed: localStorage.getItem("highestSpeed") || "",
    			status: STATUS.READY,
    			cards: shuffle(gameData).map(item => {
    				item.flipped = false;
    				return item;
    			}),
    			elapsedMs: 0,
    			displayEnd: false,
    			displayNameInput: false,
    			ranks: [],
    			userName: localStorage.getItem("userName") || ""
    		};
    	}

    	function triggerRestart() {
    		store.reset(restartGame());
    	}

    	triggerRestart();
    	const writable_props = ["gameData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Game", $$slots, []);

    	$$self.$set = $$props => {
    		if ("gameData" in $$props) $$invalidate(2, gameData = $$props.gameData);
    	};

    	$$self.$capture_state = () => ({
    		store,
    		Dashboard,
    		Chessboard,
    		PlayStatus: Play_status,
    		STATUS,
    		shuffle,
    		gameData,
    		restartGame,
    		triggerRestart,
    		$store
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameData" in $$props) $$invalidate(2, gameData = $$props.gameData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$store, triggerRestart, gameData];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { gameData: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get gameData() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameData(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/app.svelte generated by Svelte v3.24.0 */

    function create_fragment$8(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: { gameData: /*data*/ ctx[0].slice(0, 8) },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const data$1 = data.map(item => {
    		item.img = `data/${item.img}`;
    		return item;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ aList, Game, data: data$1 });
    	return [data$1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.querySelector("#application")
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

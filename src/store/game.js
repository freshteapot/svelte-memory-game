import { writable } from 'svelte/store';
import { copyObject } from "../lib/utils.js";

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


const { subscribe, set, update } = writable(state);

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
    state.displaySettings = newState.displaySettings;
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
        localStorage.setItem('highestSpeed', state.elapsedMs)
        state.highestSpeed = state.elapsedMs;
        set(state);
        return;
    }

    if (localStorage.getItem('highestSpeed') > state.elapsedMs) {
        localStorage.setItem('highestSpeed', state.elapsedMs)
        state.highestSpeed = state.elapsedMs;
        set(state);
        return;
    }
}


function toggleSettings(boo) {
    state.displaySettings = boo;
    set(state);
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
    flip(card);
}

function match() {
    decreaseMatch();
}


export default {
    subscribe,
    reset,
    decreaseMatch,
    flip,
    counting,
    updateHighestSpeed,

    toggleSettings,
    toggleEnd,
    updateUsername,

    // actions
    flipCard,
    flipCards,
    match,
    updateStatus,
}

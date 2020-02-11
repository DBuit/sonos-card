import { LitElement, html, css } from 'lit-element';
import tinycolor, { TinyColor, isReadable } from '@ctrl/tinycolor';
import { closePopUp } from 'card-tools/src/popup';
import {
  computeStateDisplay
} from 'custom-card-helpers';
class SonosCard extends LitElement {
  config: any;
  hass: any;
  shadowRoot: any;
  active: any = '';

  static get properties() {
    return {
      hass: {},
      config: {},
      active: {}
    };
  }
  
  constructor() {
    super();
  }
  
  render() {
    var icon = "mdi-stop";
    var speakerNames: any = [];
    var favorites: any = [];
    var first = true;
    for(var entity of this.config.entities) {        
      var stateObj = this.hass.states[entity];      
      //Get favorites list
      if(first) {
        first = false;
        for(var favorite of stateObj.attributes.source_list) {
          favorites.push(favorite);
        }
      }
      //Get speakerNames    
      speakerNames[entity] = stateObj.attributes.friendly_name;
  
      if(stateObj.attributes.sonos_group.length > 1 && stateObj.attributes.sonos_group[0] == entity) {
        if(stateObj.state == 'playing' && this.active == '') {
            this.active = entity;
        }
      } else if(stateObj.attributes.sonos_group.length == 1) {
        if(stateObj.state == 'playing' && this.active == '') {
          this.active = entity;
        }
      }
    }

    return html`
      <div class="center">
        <div class="groups">
        ${this.config.entities.map(entity => {
          var stateObj = this.hass.states[entity];
          if(stateObj.attributes.sonos_group.length == 1 || (stateObj.attributes.sonos_group.length > 1 && stateObj.attributes.sonos_group[0] == entity)) {
            return html`
              <div class="group" data-entity="${entity}">
                <div class="wrap ${this.active == entity? 'active':''}">
                  <div class="inner-wrap">
                    <span class="icon" style="">
                      <div class="player ${stateObj.state == 'playing'? 'active':''}">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                      </div>
                    </span>
                    ${stateObj.attributes.sonos_group.map(speaker => {
                        return html `<span class="name">${speakerNames[speaker]}</span>`;
                    })}
                    <span class="state">${stateObj.attributes.media_artist} - ${stateObj.attributes.media_title}</span>
                  </div>
                </div>
              </div>
            `;
          } else {
            return html``;
          }
        })}
        </div>

        <div class="players">
        ${this.active != ''?
          html`
            <div class="player__container">
              <div class="player__body">
                  <div class="body__cover">
                  </div>
                  <div class="body__info">
                      <div class="info__album">${this.hass.states[this.active].attributes.media_album_name}</div>
                      <div class="info__song">${this.hass.states[this.active].attributes.media_title}</div>
                      <div class="info__artist">${this.hass.states[this.active].attributes.media_artist}</div>
                  </div>
                  <div class="body__buttons">
                      <ul class="list list--buttons">
                          <li class="middle"><a class="list__link">
                              ${this.hass.states[this.active].state != 'playing' ? html`<ha-icon @click="${() => this._play(this.active)}" .icon=${"mdi:play"}></ha-icon>` : html`<ha-icon @click="${() => this._pause(this.active)}" .icon=${"mdi:stop"}></ha-icon>`}
                          
                          </a></li>
                      </ul>
                  </div>
              </div>
              <div class="player__footer">
                  <ul class="list list--footer">
                      <li><ha-icon @click="${() => this._volumeDown(this.active)}" .icon=${"mdi:volume-minus"}></ha-icon><input type="range" .value="${100 * this.hass.states[this.active].attributes.volume_level}" @change=${e => this._volumeSet(this.active, e.target.value)} min="0" max="100" id="volumeRange" class="volumeRange" style="background: linear-gradient(to right, rgb(211, 3, 32) 0%, rgb(211, 3, 32) ${100 * this.hass.states[this.active].attributes.volume_level}%, rgb(211, 211, 211) ${100 * this.hass.states[this.active].attributes.volume_level}%, rgb(211, 211, 211) 100%);"><ha-icon @click="${() => this._volumeUp(this.active)}" .icon=${"mdi:volume-plus"}></ha-icon></li>
                  </ul>
              </div>
            </div>
          `
          :html``}
        </div>

        <div class="sidebar">
          <ul class="members">
            ${this.active != '' ? html`${this.hass.states[this.active].attributes.sonos_group.map(entity => {
              if(entity != this.active) {
              return html`
                <li>
                  <div class="member unjoin-member" data-member="${entity}" @click="${e => this._unjoin(e)}">
                    <div class="member-inner">
                      <ha-icon .icon=${"mdi:minus"}></ha-icon>
                      <span>${speakerNames[entity]} </span>
                    </div>
                  </div>
                </li>
              `;
              } else {
                return html``;
              }
            })}
            ${this.config.entities.map(entity => {
              if(entity != this.active && !this.hass.states[this.active].attributes.sonos_group.includes(entity)) {
                return html`
                  <li>
                    <div class="member join-member" data-member="${entity}" @click="${e => this._join(e)}">
                      <div class="member-inner">
                        <ha-icon .icon=${"mdi:plus"}></ha-icon>
                        <span>${speakerNames[entity]} </span>
                      </div>
                    </div>
                  </li>
                `;
              } else {
                return html``;
              }
            })}`: html ``}
          </ul>
        </div>
      </div>
      <div class="center">
        <ul class="favorites">
          ${favorites.map(favorite => {
            return html`
              <li>
                <div class="favorite" data-favorite="${favorite}" @click="${e => this._sourceSet(e)}">
                  <div class="favorite-inner">
                    <span class="icon" style="">
                      <ha-icon .icon=${"mdi:play"}></ha-icon>
                    </span>
                    <span class="name">${favorite}</span>
                  </div>
                </div>
              
              </li>
            `;
          })}
        </ul>
      </div>
    `;
  }
  
  updated() {
    //Set active player
    this.shadowRoot.querySelectorAll(".group").forEach(group => {
      group.addEventListener('click', () => {
          this.active = group.dataset.entity;
      })
  });
  }

  _pause(entity) {
    this.hass.callService("media_player", "media_pause", {
        entity_id: entity
    });
  }
  
  _play(entity) {
    this.hass.callService("media_player", "media_play", {
        entity_id: entity
    });
  }
  
  _volumeDown(entity) {
    this.hass.callService("media_player", "volume_down", {
        entity_id: entity
    });

    for(var member in this.hass.states[entity].sonos_group) {
      if(member != entity) {
        this.hass.callService("media_player", "volume_down", {
            entity_id: member
        });
      }
    }
    
  }
  
  _volumeUp(entity) {
    this.hass.callService("media_player", "volume_up", {
        entity_id: entity
    }); 
    
    for(var member in this.hass.states[entity].sonos_group) {
      if(member != entity) {
        this.hass.callService("media_player", "volume_up", {
            entity_id: member
        });
      }
    }
  }
  
  _volumeSet(entity, volume) {
    var volumeFloat = volume/100;
    this.hass.callService("media_player", "volume_set", {
        entity_id: entity,
        volume_level: volumeFloat
    });  
    
    for(var member in this.hass.states[entity].sonos_group) {
      if(member != entity) {
        this.hass.callService("media_player", "volume_set", {
            entity_id: member,
            volume_level: volumeFloat
        });  
      }
    }
  }

  _sourceSet(e) {
    if(e.target.dataset && e.target.dataset.favorite) {
      console.log(this.active);
      console.log(e.target.dataset.favorite);
      this.hass.callService("media_player", "select_source", {
        source: e.target.dataset.favorite,
        entity_id: this.active
      });
    }
    
  }
  _join(e) {
    if(e.target.dataset && e.target.dataset.member) {
      console.log(this.active);
      console.log(e.target.dataset.member);
      this.hass.callService("sonos", "join", {
        master: this.active,
        entity_id: e.target.dataset.member
      });
    }
    
  }
  _unjoin(e) {
    if(e.target.dataset && e.target.dataset.member) {
      console.log(this.active);
      console.log(e.target.dataset.member);
      this.hass.callService("sonos", "unjoin", {
        master: this.active,
        entity_id: e.target.dataset.member
      });
    }
  }
  
  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    this.config = config;
  }

  getCardSize() {
    return 1;
  }
  
  static get styles() {
    return css`
      ha-card {
        background: var(
          --ha-card-background,
          var(--paper-card-background-color, white)
        );
        border-radius: var(--ha-card-border-radius, 2px);
        box-shadow: var(
          --ha-card-box-shadow,
          0 2px 2px 0 rgba(0, 0, 0, 0.14),
          0 1px 5px 0 rgba(0, 0, 0, 0.12),
          0 3px 1px -2px rgba(0, 0, 0, 0.2)
        );
        color: var(--primary-text-color);
        display: block;
        transition: all 0.3s ease-out;
        padding: 16px;
      }
      .header {
        color: var(--ha-card-header-color, --primary-text-color);
        font-family: var(--ha-card-header-font-family, inherit);
        font-size: var(--ha-card-header-font-size, 24px);
        letter-spacing: -0.012em;
        line-height: 32px;
        padding: 4px 0 12px;
        display: block;
      }
      .header .name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .players {
        margin: 3px 5px;
        width: 382px;
      }
      .player__container {
        margin:0;
        background: #fff;
        border-radius: 12px;
        box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 3px 0px;
      }

      .body__cover {
        position: relative;
      }

      .body__cover img {
        max-width: 100%;
        width:100%;
        border-radius: 0.25rem;
      }

      .list {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        margin: 0;
        padding: 0;
        list-style-type: none;
      }

      .body__buttons,
      .body__info,
      .player__footer {
        padding-right: 2rem;
        padding-left: 2rem;
      }


      .list--footer {
        justify-content: space-between;
      }
      .list--footer li:last-child {
        flex:1;
        display:flex;
        flex-direction: row;
        margin-left:15px;
      }
      .list--footer li:last-child input {
        flex:1;
      }
      .list--footer li:last-child ha-icon {
        margin:0 5px;
        color: #888;
        font-size:16px;
      }

      .volumeRange {
        -webkit-appearance: none;
        height: 5px;
        border-radius: 5px;
        background: #d3d3d3;
        outline: none;
        opacity: 0.7;
        -webkit-transition: .2s;
        transition: opacity .2s;
        margin: 6px 5px 0 5px;
      }



      .list--cover {
        justify-content: flex-end;
      }

      .list--header .list__link,
      .list--footer .list__link {
        color: #888;
      }

      .list--cover {
        position: absolute;
        top: .5rem;
        width: 100%;
      }
      .list--cover li:first-of-type {
        margin-left: .75rem;
      }
      .list--cover li:last-of-type {
        margin-right: .75rem;
      }
      .list--cover a {
        font-size: 1.15rem;
        color: #fff;
      }

      .range {
        position: relative;
        top: -1.5rem;
        right: 0;
        left: 0;
        margin: auto;
        background: rgba(255, 255, 255, 0.95);
        width: 80%;
        height: 0.125rem;
        border-radius: 0.25rem;
        cursor: pointer;
      }
      .range:before, .range:after {
        content: "";
        position: absolute;
        cursor: pointer;
      }
      .range:before {
        width: 3rem;
        height: 100%;
        background: -webkit-linear-gradient(left, rgba(211, 3, 32, 0.5), rgba(211, 3, 32, 0.85));
        background: linear-gradient(to right, rgba(211, 3, 32, 0.5), rgba(211, 3, 32, 0.85));
        border-radius: 0.25rem;
        overflow: hidden;
      }
      .range:after {
        top: -0.375rem;
        left: 3rem;
        z-index: 3;
        width: 0.875rem;
        height: 0.875rem;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.15);
        -webkit-transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
      }
      .range:focus:after, .range:hover:after {
        background: rgba(211, 3, 32, 0.95);
      }

      .body__info {
        padding-top: 1.5rem;
        padding-bottom: 1.25rem;
        text-align: center;
      }

      .info__album,
      .info__song {
        margin-bottom: .5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .info__artist,
      .info__album {
        font-size: .75rem;
        font-weight: 300;
        color: #666;
      }
      
      .info__artist {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .info__song {
        font-size: 1.15rem;
        font-weight: 400;
        color: #d30320;
      }

      .body__buttons {
        padding-bottom: 2rem;
      }

      .body__buttons {
        padding-top: 1rem;
      }

      .list--buttons {
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        -webkit-box-pack: center;
        -ms-flex-pack: center;
        justify-content: center;
      }

      .list--buttons li:nth-of-type(n+2) {
        margin-left: 1.25rem;
      }

      .list--buttons a {
        padding-top: .45rem;
        padding-right: .75rem;
        padding-bottom: .45rem;
        padding-left: .75rem;
        font-size: 1rem;
        border-radius: 50%;
        box-shadow: 0 3px 6px rgba(33, 33, 33, 0.1), 0 3px 12px rgba(33, 33, 33, 0.15);
      }
      .list--buttons a:focus, .list--buttons a:hover {
        color: rgba(171, 2, 26, 0.95);
        opacity: 1;
        box-shadow: 0 6px 9px rgba(33, 33, 33, 0.1), 0 6px 16px rgba(33, 33, 33, 0.15);
      }

      .list--buttons li.middle a {
        padding: .82rem;
        margin-left: .5rem;
        font-size: 1.25rem!important;
        color: rgba(211, 3, 32, 0.95)!important;
        opacity:1!important;
      }

      .list--buttons li:first-of-type a,
      .list--buttons li:last-of-type a {
        font-size: .95rem;
        color: #212121;
        opacity: .5;
      }
      .list--buttons li:first-of-type a:focus, .list--buttons li:first-of-type a:hover,
      .list--buttons li:last-of-type a:focus,
      .list--buttons li:last-of-type a:hover {
        color: #d30320;
        opacity: .75;
      }

      .list__link {
        -webkit-transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
        transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
      }
      .list__link:focus, .list__link:hover {
        color: #d30320;
      }

      .player__footer {
        padding-top: 1rem;
        padding-bottom: 2rem;
      }

      .list--footer a {
        opacity: .5;
      }
      .list--footer a:focus, .list--footer a:hover {
        opacity: .9;
      }

      .shuffle.active {
        color: #d30320;
        opacity:0.9;
      }

      .center {
        margin:2rem auto;
        display: flex;
        flex-direction: row;
        justify-content: center;
      }

      .groups {
        margin: 0;
        padding: 0;
        width: auto;
      }
      .groups > .group {
        padding:0;
        margin:0;
      }
      .group .wrap {
        cursor: pointer;
        display: inline-block;
        width: 100px;
        height: 100px;
        background-color: rgba(255, 255, 255, 0.8);
        box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 3px 0px;
        position: relative;
        font-weight: 300;
        touch-action: auto !important;
        padding: 10px;
        border-radius: 12px;
        margin: 3px;
        overflow: hidden;
      }
      .group .wrap.active {
        background-color: rgba(255, 255, 255, 1);
      }

      .group .wrap .inner-wrap {
        display: flex;
        flex-direction: column;
        height: 100%;
        pointer-events: none;
      }

      .group .wrap .inner-wrap span.icon {
        display: block;
        height: 40px;
        width: 40px;
        color: #d30320;
        font-size: 30px;
        transform-origin: 50% 50%;
        line-height: 40px;
        text-align: center;
        pointer-events: none;
      }
      .group .wrap .inner-wrap span.icon ha-icon {
        width: 30px;
        height: 30px;
        pointer-events: none;
      }
      .group .wrap .inner-wrap span.name {
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.4);
        width: 100%;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow-wrap: break-word;
        white-space: normal;
        pointer-events: none;
        overflow: hidden;
      }
      .inner-wrap span:nth-child(2) {
        margin-top: auto;
      }

      .group .wrap .inner-wrap span.state {
        position: relative;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.4);
        text-transform: capitalize;
        float: left;
        white-space: nowrap;
        pointer-events: none;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .group .player {
        position: relative;
        width: 30px;
        height: 30px;
      }

      .group .player .bar {
        background: #666;
        bottom: 1px;
        height: 3px;
        position: absolute;
        width: 4px;
        animation: sound 0ms -800ms linear infinite alternate;
        display:block;
      }

      .group .player .bar:nth-child(1) {
        left: 1px;
      }
      .group .player .bar:nth-child(2) {
        left: 6px;
      }
      .group .player .bar:nth-child(3) {
        left: 11px;
      }

      .group .player.active .bar:nth-child(1) {
        animation-duration: 474ms;
      }
      .group .player.active .bar:nth-child(2) {
        animation-duration: 433ms;
      }
      .group .player.active .bar:nth-child(3) {
        animation-duration: 407ms;
      }


      .group .wrap .inner-wrap span.name,
      .group .wrap .inner-wrap span.state {
        color: rgb(0, 0, 0);
      }

      .sidebar {
        width: auto;
        margin: 0;
        padding: 0;
      }
      ul.members {
        list-style:none;
        padding:0;
        margin:0;
      }
      ul.members > li {
        padding:0;
        margin:0;
      }
      ul.members > li .member {
        cursor: pointer;
        display: inline-block;
        width: 100px;
        height: 50px;
        background-color: rgba(255, 255, 255, 0.8);
        box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 3px 0px;
        position: relative;
        font-weight: 300;
        touch-action: auto !important;
        padding: 10px;
        border-radius: 12px;
        margin: 3px;
        overflow: hidden;
      }
      ul.members > li .member .member-inner {
        display: flex;
        flex-direction: column;
        height: 100%;
        pointer-events: none;
      }
      ul.members > li .member span {
        font-size: 14px;
        font-weight: 500;
        color: #000;
        width: 100%;
        margin-top: auto;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow-wrap: break-word;
        white-space: normal;
        pointer-events: none;
        overflow: hidden;
      }
      ul.members > li .member ha-icon {
        display: block;
        height: 30px;
        width: 30px;
        color: #888;
        font-size: 30px;
        transform-origin: 50% 50%;
        line-height: 40px;
        text-align: center;
        pointer-events: none;
      }
      ul.members > li .member:hover ha-icon {
        color: #d30320;
      }

      ul.favorites {
        width: 644px;
        margin: 0;
        padding: 0;
      }
      ul.favorites > li {
        padding:0;
        margin:0;
        display:inline-block;
      }
      ul.favorites > li .favorite {
        cursor: pointer;
        display: inline-block;
        width: 100px;
        height: 100px;
        background-color: rgba(255, 255, 255, 0.8);
        box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 3px 0px;
        position: relative;
        font-weight: 300;
        touch-action: auto !important;
        padding: 10px;
        border-radius: 12px;
        margin: 3px;
        overflow: hidden;
      }
      ul.favorites > li .favorite .favorite-inner {
        display: flex;
        flex-direction: column;
        height: 100%;
        pointer-events: none;
      }
      ul.favorites > li .favorite span.icon {
        display: block;
        height: 40px;
        width: 40px;
        color: #d30320;
        font-size: 30px;
        transform-origin: 50% 50%;
        line-height: 40px;
        text-align: center;
        pointer-events: none;
      }
      ul.favorites > li .favorite span.icon ha-icon {
        width: 30px;
        height: 30px;
        pointer-events: none;
      }
      ul.favorites > li .favorite span.name {
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.4);
        width: 100%;
        margin-top: auto;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow-wrap: break-word;
        white-space: normal;
        pointer-events: none;
        overflow: hidden;
      }


      @keyframes sound {
        0% {
          opacity: .35;
          height: 3px;
        }
        100% {
          opacity: 1;
          height: 20px;
        }
      }
    `;
  }  
  
}

customElements.define('sonos-card', SonosCard);

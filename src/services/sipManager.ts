import { Web } from 'sip.js';
import { SipPbxConfig, SipRegistrationState, SipCallSession, EmployeeExtension } from '../types';

export interface IncomingSipCallEvent {
  callerNumber: string;
  callerName: string;
  organization?: string;
  branch?: string;
  sessionId: string;
}

export interface OnlineExtensionInfo {
  extension: string;
  name: string;
}

export type SipStatusCallback = (state: SipRegistrationState, message?: string) => void;
export type IncomingCallCallback = (call: IncomingSipCallEvent) => void;
export type CallSessionCallback = (session: SipCallSession | null) => void;
export type AudioLevelCallback = (level: number) => void;
export type OnlineExtensionsCallback = (extensions: OnlineExtensionInfo[]) => void;

class SipTelephonyManager {
  private config: SipPbxConfig = {
    enabled: true,
    serverUrl: 'wss://pbx.lahore-dc.internal:8089/ws',
    domain: 'pbx.lahore-dc.internal',
    transport: 'inbuilt-webrtc',
    stunServer: 'stun:stun.l.google.com:19302',
    didNumber: '+92 (42) 111-327-800',
    sipSecretDefault: 'FastConnect@123',
    autoRegister: true,
    pjsipPort: 5060,
    wssPort: 8089,
    rtpPortRange: '10000-20000',
  };

  private currentExtension: EmployeeExtension | null = null;
  private registrationState: SipRegistrationState = 'unregistered';
  private lastStatusMessage: string = 'Telephony subsystem uninitialized';
  
  // SIP.js SimpleUser instance (Option B - External Asterisk / FreePBX WSS)
  private simpleUser: InstanceType<typeof Web.SimpleUser> | null = null;
  
  // In-Built WebRTC Bridge (Peer-to-Peer browser calling via /ws/telephony)
  private bridgeWs: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private currentActiveCallSession: SipCallSession | null = null;
  private pendingOffer: any = null;
  private queuedIceCandidates: RTCIceCandidateInit[] = [];
  private remotePeerExtension: string | null = null;
  private onlineExtensions: OnlineExtensionInfo[] = [];

  // Audio elements & analyzer
  private remoteAudioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStreamSource: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;

  // Remote party audio stream & analyzer
  private remoteStream: MediaStream | null = null;
  private remoteAudioContext: AudioContext | null = null;
  private remoteAnalyser: AnalyserNode | null = null;
  private remoteAudioSource: MediaStreamAudioSourceNode | null = null;
  private remoteAnimFrameId: number | null = null;

  // Subscribers
  private statusSubscribers: Set<SipStatusCallback> = new Set();
  private incomingCallSubscribers: Set<IncomingCallCallback> = new Set();
  private sessionSubscribers: Set<CallSessionCallback> = new Set();
  private audioLevelSubscribers: Set<AudioLevelCallback> = new Set();
  private remoteAudioLevelSubscribers: Set<AudioLevelCallback> = new Set();
  private onlineSubscribers: Set<OnlineExtensionsCallback> = new Set();

  constructor() {
    this.ensureAudioElement();
  }

  private ensureAudioElement() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    let audio = document.getElementById('fastconnect-remote-sip-audio') as HTMLAudioElement;
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'fastconnect-remote-sip-audio';
      audio.autoplay = true;
      (audio as any).playsInline = true;
      // Modern Chromium/Edge: display:none suppresses media playback in background tabs/rendering.
      // Use fixed invisible positioning so the audio subsystem retains full DOM layout and active playback.
      audio.style.position = 'fixed';
      audio.style.bottom = '0';
      audio.style.right = '0';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0.01';
      audio.style.pointerEvents = 'none';
      audio.style.zIndex = '-9999';
      document.body.appendChild(audio);
    }
    this.remoteAudioElement = audio;
  }

  /**
   * Browser autoplay unlock method — called directly on user click (Call / Answer / Screen click)
   */
  public unlockAudio() {
    this.ensureAudioElement();
    if (this.remoteAudioElement) {
      this.remoteAudioElement.play().catch(() => {});
    }
  }

  public updateConfig(newConfig: Partial<SipPbxConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): SipPbxConfig {
    return { ...this.config };
  }

  public setExtension(ext: EmployeeExtension) {
    const isDifferent = !this.currentExtension || this.currentExtension.extension !== ext.extension;
    this.currentExtension = ext;
    if (isDifferent && this.config.autoRegister && this.config.enabled) {
      this.register();
    }
  }

  public getRegistrationState(): SipRegistrationState {
    return this.registrationState;
  }

  public getLastMessage(): string {
    return this.lastStatusMessage;
  }

  public getActiveSession(): SipCallSession | null {
    return this.currentActiveCallSession;
  }

  public getOnlineExtensions(): OnlineExtensionInfo[] {
    return [...this.onlineExtensions];
  }

  // Subscription APIs
  public onStatusChange(cb: SipStatusCallback): () => void {
    this.statusSubscribers.add(cb);
    cb(this.registrationState, this.lastStatusMessage);
    return () => this.statusSubscribers.delete(cb);
  }

  public onIncomingCall(cb: IncomingCallCallback): () => void {
    this.incomingCallSubscribers.add(cb);
    return () => this.incomingCallSubscribers.delete(cb);
  }

  public onSessionChange(cb: CallSessionCallback): () => void {
    this.sessionSubscribers.add(cb);
    cb(this.currentActiveCallSession);
    return () => this.sessionSubscribers.delete(cb);
  }

  public onAudioLevel(cb: AudioLevelCallback): () => void {
    this.audioLevelSubscribers.add(cb);
    return () => this.audioLevelSubscribers.delete(cb);
  }

  public onRemoteAudioLevel(cb: AudioLevelCallback): () => void {
    this.remoteAudioLevelSubscribers.add(cb);
    return () => this.remoteAudioLevelSubscribers.delete(cb);
  }

  public onOnlineExtensions(cb: OnlineExtensionsCallback): () => void {
    this.onlineSubscribers.add(cb);
    cb([...this.onlineExtensions]);
    return () => this.onlineSubscribers.delete(cb);
  }

  private notifyStatus(state: SipRegistrationState, message: string) {
    this.registrationState = state;
    this.lastStatusMessage = message;
    this.statusSubscribers.forEach((cb) => cb(state, message));
  }

  private notifySession(session: SipCallSession | null) {
    this.currentActiveCallSession = session;
    this.sessionSubscribers.forEach((cb) => cb(session));
  }

  // =========================================================================
  // Primary Registration Flow
  // =========================================================================
  public async register(): Promise<void> {
    if (!this.currentExtension) {
      this.notifyStatus('unregistered', 'No desk extension selected');
      return;
    }

    if (this.registrationState === 'connecting' || this.registrationState === 'call-in-progress') {
      return;
    }

    this.notifyStatus('connecting', `Connecting Extension ${this.currentExtension.extension} to PBX...`);

    if (this.config.transport === 'wss') {
      await this.registerAsteriskWss();
    } else {
      await this.registerInbuiltBridge();
    }
  }

  // -------------------------------------------------------------------------
  // Mode 1: External Asterisk / FreePBX via SIP.js SimpleUser over WSS (Option B)
  // -------------------------------------------------------------------------
  private async registerAsteriskWss() {
    this.ensureAudioElement();
    const ext = this.currentExtension!;
    const domain = this.config.domain || 'fastconnect.internal';
    const aor = `sip:${ext.extension}@${domain}`;
    const password = ext.sipPassword || ext.pin || this.config.sipSecretDefault;

    try {
      if (this.simpleUser) {
        try {
          await this.simpleUser.disconnect();
        } catch {}
        this.simpleUser = null;
      }

      this.simpleUser = new Web.SimpleUser(this.config.serverUrl, {
        aor,
        media: {
          remote: {
            audio: this.remoteAudioElement || undefined,
          },
          constraints: { audio: true, video: false },
        },
        userAgentOptions: {
          authorizationUsername: ext.sipAuthUser || ext.extension,
          authorizationPassword: password,
          displayName: ext.name,
        },
        delegate: {
          onServerConnect: () => {
            this.notifyStatus('connecting', `WSS Socket Connected: ${this.config.serverUrl}`);
          },
          onServerDisconnect: (error?: any) => {
            const msg = error ? `WSS connection notice: ${error.message || error}` : 'Disconnected from PBX server';
            this.notifyStatus('disconnected', msg);
          },
          onRegistered: () => {
            this.notifyStatus('registered', `Registered with Asterisk PBX: ${aor}`);
          },
          onUnregistered: () => {
            this.notifyStatus('unregistered', 'Unregistered from PBX');
          },
          onCallReceived: async () => {
            this.notifyStatus('call-in-progress', 'Incoming call from Asterisk PBX trunk...');
            const sessionData: SipCallSession = {
              sessionId: `sip-${Date.now()}`,
              remoteTarget: 'PBX Caller',
              direction: 'inbound',
              state: 'ringing',
              startTime: Date.now(),
              durationSeconds: 0,
              isMuted: false,
              isHeld: false,
              callerDisplayName: 'Inbound Customer Trunk',
            };
            this.notifySession(sessionData);

            this.incomingCallSubscribers.forEach((cb) =>
              cb({
                callerNumber: this.config.didNumber || '+92 42 111-327-800',
                callerName: 'Direct Inward Trunk',
                organization: 'Commercial Client',
                branch: 'External Branch',
                sessionId: sessionData.sessionId,
              })
            );
          },
          onCallAnswered: () => {
            if (this.currentActiveCallSession) {
              this.notifySession({
                ...this.currentActiveCallSession,
                state: 'connected',
                startTime: Date.now(),
              });
            }
            this.notifyStatus('call-in-progress', 'In active call via Asterisk WebRTC');
            this.startLocalAudioLevelMeter();
          },
          onCallHangup: () => {
            this.stopLocalAudioLevelMeter();
            this.notifySession(null);
            this.notifyStatus('registered', `Ready on Asterisk PBX (Ext ${ext.extension})`);
          },
          onCallHold: (held: boolean) => {
            if (this.currentActiveCallSession) {
              this.notifySession({
                ...this.currentActiveCallSession,
                isHeld: held,
                state: held ? 'held' : 'connected',
              });
            }
          },
        },
      });

      await this.simpleUser.connect();
      await this.simpleUser.register();
    } catch (err: any) {
      console.warn('[SIP Manager] Asterisk registration error:', err);
      const isSsl = this.config.serverUrl.startsWith('wss://');
      const guidance = isSsl 
        ? ' Note: If your Asterisk server uses a self-signed SSL cert, open the URL in a new browser tab to accept it.' 
        : '';
      this.notifyStatus('registration-failed', `Connection to ${this.config.serverUrl} failed: ${err.message || 'Check WSS port & TLS cert.'}${guidance}`);
    }
  }

  // -------------------------------------------------------------------------
  // Mode 2: In-built WebRTC Telephony Bridge (/ws/telephony)
  // -------------------------------------------------------------------------
  private async registerInbuiltBridge() {
    this.ensureAudioElement();
    const ext = this.currentExtension!;

    if (this.bridgeWs) {
      try {
        this.bridgeWs.close();
      } catch {}
      this.bridgeWs = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/telephony`;

      const ws = new WebSocket(wsUrl);
      this.bridgeWs = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'register',
            extension: ext.extension,
            name: ext.name,
            role: ext.role,
            department: ext.department,
          })
        );
        // Request list of online extensions
        ws.send(JSON.stringify({ type: 'get-online-extensions' }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          await this.handleBridgeMessage(data);
        } catch (e) {
          console.error('[WebRTC Bridge] Error parsing message:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('[WebRTC Bridge] Socket notice:', e);
      };

      ws.onclose = () => {
        if (this.registrationState !== 'unregistered') {
          this.notifyStatus('disconnected', 'WebRTC Telephony Bridge disconnected');
        }
      };
    } catch (err: any) {
      console.error('[WebRTC Bridge] Registration failed:', err);
      this.notifyStatus('registration-failed', `Failed to connect to local WebRTC Bridge: ${err.message}`);
    }
  }

  private async handleBridgeMessage(data: any) {
    const ext = this.currentExtension;
    if (!ext) return;

    switch (data.type) {
      case 'registered':
        this.notifyStatus('registered', `Extension ${ext.extension} Registered (FAST Connect WebRTC Engine)`);
        break;

      case 'extensions-online':
        this.onlineExtensions = data.list || [];
        this.onlineSubscribers.forEach((cb) => cb(this.onlineExtensions));
        break;

      case 'incoming-call': {
        const sessionId = data.callId || `call-${Date.now()}`;
        this.remotePeerExtension = data.callerExtension;
        if (data.offer) {
          this.pendingOffer = data.offer;
        }

        const session: SipCallSession = {
          sessionId,
          remoteTarget: data.callerExtension || data.callerNumber || 'Unknown Caller',
          direction: 'inbound',
          state: 'ringing',
          startTime: Date.now(),
          durationSeconds: 0,
          isMuted: false,
          isHeld: false,
          callerDisplayName: data.callerName || `Ext ${data.callerExtension}`,
        };
        this.notifySession(session);
        this.notifyStatus('call-in-progress', `Incoming call from ${session.callerDisplayName}`);

        this.incomingCallSubscribers.forEach((cb) =>
          cb({
            callerNumber: data.callerNumber || `Ext ${data.callerExtension}`,
            callerName: data.callerName || `Officer (${data.callerExtension})`,
            organization: data.organization || 'Corporate Branch',
            branch: data.branch || 'Internal PBX',
            sessionId,
          })
        );
        break;
      }

      case 'call-offer': {
        // Save the offer; do NOT auto-answer! Wait until the user clicks Answer!
        this.pendingOffer = data.offer;
        this.remotePeerExtension = data.callerExtension;
        break;
      }

      case 'call-answer': {
        if (this.peerConnection) {
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            // Drain any queued ICE candidates that arrived before answer
            while (this.queuedIceCandidates.length > 0) {
              const cand = this.queuedIceCandidates.shift();
              if (cand) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
              }
            }
          } catch (e) {
            console.warn('[WebRTC] Set remote answer error:', e);
          }
        }
        if (this.currentActiveCallSession) {
          this.notifySession({
            ...this.currentActiveCallSession,
            state: 'connected',
            startTime: Date.now(),
          });
        }
        this.notifyStatus('call-in-progress', 'Two-Way Audio Call Active');
        this.startLocalAudioLevelMeter();
        break;
      }

      case 'ice-candidate': {
        if (this.peerConnection && this.peerConnection.remoteDescription) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn('[WebRTC] Add ICE candidate error:', e);
          }
        } else if (data.candidate) {
          this.queuedIceCandidates.push(data.candidate);
        }
        break;
      }

      case 'call-failed': {
        this.cleanupCall();
        this.notifySession(null);
        this.notifyStatus('registered', data.reason || 'Call failed: destination unreachable');
        break;
      }

      case 'call-ended':
      case 'call-rejected': {
        this.cleanupCall();
        this.notifySession(null);
        this.notifyStatus('registered', data.type === 'call-rejected' ? 'Call was declined by recipient.' : `Ready on Desk (Ext ${ext.extension})`);
        break;
      }

      case 'call-held': {
        if (this.currentActiveCallSession) {
          this.notifySession({
            ...this.currentActiveCallSession,
            isHeld: Boolean(data.held),
            state: data.held ? 'held' : 'connected',
          });
        }
        break;
      }
    }
  }

  // =========================================================================
  // WebRTC PeerConnection Handlers (for Real Browser Voice Calling)
  // =========================================================================
  private async createPeerConnection(targetExtension: string) {
    this.remotePeerExtension = targetExtension;
    this.queuedIceCandidates = [];

    const config: RTCConfiguration = {
      iceServers: [
        {
          urls: [
            this.config.stunServer || 'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun.cloudflare.com:3478',
            'stun:global.stun.twilio.com:3478',
          ],
        },
        ...(this.config.turnServer
          ? [
              {
                urls: this.config.turnServer,
                username: this.config.turnUsername,
                credential: this.config.turnPassword,
              },
            ]
          : []),
      ],
      iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(config);
    this.peerConnection = pc;

    // Acquire microphone with high-fidelity speech processing & echo cancellation
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
      this.startLocalAudioLevelMeter();
    } catch (e: any) {
      console.warn('[WebRTC] Microphone permission notice:', e.message);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.bridgeWs?.readyState === WebSocket.OPEN) {
        this.bridgeWs.send(
          JSON.stringify({
            type: 'ice-candidate',
            target: String(targetExtension),
            candidate: event.candidate,
          })
        );
      }
    };

    pc.ontrack = (event) => {
      this.ensureAudioElement();
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      this.remoteStream = stream;
      if (this.remoteAudioElement) {
        this.remoteAudioElement.srcObject = stream;
        this.remoteAudioElement.play().catch((e) => {
          console.warn('[WebRTC] Remote audio autoplay notice:', e);
        });
      }
      this.startRemoteAudioLevelMeter(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        if (this.currentActiveCallSession) {
          this.notifySession({
            ...this.currentActiveCallSession,
            state: 'connected',
            startTime: Date.now(),
          });
        }
        this.notifyStatus('call-in-progress', 'WebRTC Two-Way Audio Active');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.hangup();
      }
    };

    return pc;
  }

  // =========================================================================
  // Outbound Call Flow
  // =========================================================================
  public async makeCall(target: string, name?: string, org?: string, branch?: string): Promise<boolean> {
    if (!this.currentExtension) return false;

    const cleanedTarget = target.trim();
    if (!cleanedTarget) return false;

    if (cleanedTarget === this.currentExtension.extension) {
      this.notifyStatus('registered', 'Cannot dial your own extension');
      return false;
    }

    const session: SipCallSession = {
      sessionId: `call-${Date.now()}`,
      remoteTarget: cleanedTarget,
      direction: 'outbound',
      state: 'establishing',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isHeld: false,
      callerDisplayName: name || `Extension ${cleanedTarget}`,
    };
    this.notifySession(session);
    this.notifyStatus('call-in-progress', `Dialing ${cleanedTarget}...`);

    if (this.config.transport === 'wss' && this.simpleUser) {
      try {
        const domain = this.config.domain || 'fastconnect.internal';
        const targetUri = cleanedTarget.includes('@') ? cleanedTarget : `sip:${cleanedTarget}@${domain}`;
        await this.simpleUser.call(targetUri);
        return true;
      } catch (err: any) {
        console.warn('[SIP Manager] Asterisk call failed:', err);
        this.notifyStatus('registered', `Call to ${cleanedTarget} failed: ${err.message}`);
        this.notifySession(null);
        return false;
      }
    } else {
      // Inbuilt WebRTC Bridge
      try {
        this.cleanupCall();
        const pc = await this.createPeerConnection(cleanedTarget);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (this.bridgeWs?.readyState === WebSocket.OPEN) {
          this.bridgeWs.send(
            JSON.stringify({
              type: 'call-offer',
              callerExtension: this.currentExtension.extension,
              callerName: this.currentExtension.name,
              organization: org || 'FAST Connect Internal',
              branch: branch || 'PBX Corridor',
              target: cleanedTarget,
              offer,
            })
          );
        }
        return true;
      } catch (err: any) {
        console.warn('[WebRTC Bridge] Outbound call error:', err);
        this.cleanupCall();
        this.notifySession(null);
        this.notifyStatus('registered', `Call failed: ${err.message}`);
        return false;
      }
    }
  }

  // =========================================================================
  // Answer Inbound Call
  // =========================================================================
  public async answerCall(): Promise<void> {
    if (this.config.transport === 'wss' && this.simpleUser) {
      try {
        await this.simpleUser.answer();
      } catch (e) {
        console.warn('Answer error on SimpleUser:', e);
      }
    } else {
      if (!this.remotePeerExtension && this.currentActiveCallSession) {
        this.remotePeerExtension = this.currentActiveCallSession.remoteTarget;
      }

      if (this.pendingOffer && this.remotePeerExtension) {
        try {
          const pc = await this.createPeerConnection(this.remotePeerExtension);
          await pc.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));

          // Drain queued ICE candidates
          while (this.queuedIceCandidates.length > 0) {
            const cand = this.queuedIceCandidates.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (this.bridgeWs?.readyState === WebSocket.OPEN) {
            this.bridgeWs.send(
              JSON.stringify({
                type: 'call-answer',
                target: this.remotePeerExtension,
                answer,
              })
            );
          }
        } catch (e: any) {
          console.error('[WebRTC Bridge] Error creating answer:', e);
        }
      }

      if (this.currentActiveCallSession) {
        this.notifySession({
          ...this.currentActiveCallSession,
          state: 'connected',
          startTime: Date.now(),
        });
      }
      this.notifyStatus('call-in-progress', 'Call Connected via WebRTC');
      this.startLocalAudioLevelMeter();
    }
  }

  // =========================================================================
  // Decline Inbound Call
  // =========================================================================
  public async declineCall(): Promise<void> {
    if (this.config.transport === 'wss' && this.simpleUser) {
      try {
        await this.simpleUser.decline();
      } catch (e) {
        console.warn('Decline error on SimpleUser:', e);
      }
    } else {
      const target = this.remotePeerExtension || this.currentActiveCallSession?.remoteTarget;
      if (target && this.bridgeWs?.readyState === WebSocket.OPEN) {
        this.bridgeWs.send(
          JSON.stringify({
            type: 'call-rejected',
            target,
            reason: 'Declined by recipient',
          })
        );
      }
      this.cleanupCall();
    }
    this.notifySession(null);
    if (this.currentExtension) {
      this.notifyStatus('registered', `Ready on Desk (Ext ${this.currentExtension.extension})`);
    }
  }

  // =========================================================================
  // Call Controls: Hangup, Hold, Mute, DTMF
  // =========================================================================
  public async hangup(): Promise<void> {
    if (this.config.transport === 'wss' && this.simpleUser) {
      try {
        await this.simpleUser.hangup();
      } catch (e) {
        console.warn('Hangup error:', e);
      }
    } else {
      const target = this.remotePeerExtension || this.currentActiveCallSession?.remoteTarget;
      if (target && this.bridgeWs?.readyState === WebSocket.OPEN) {
        this.bridgeWs.send(
          JSON.stringify({
            type: 'call-ended',
            target,
          })
        );
      }
      this.cleanupCall();
    }

    this.notifySession(null);
    if (this.currentExtension) {
      this.notifyStatus('registered', `Ready on Desk (Ext ${this.currentExtension.extension})`);
    } else {
      this.notifyStatus('unregistered', 'Ready');
    }
  }

  public toggleMute(): boolean {
    if (this.config.transport === 'wss' && this.simpleUser) {
      if (this.simpleUser.isMuted()) {
        this.simpleUser.unmute();
      } else {
        this.simpleUser.mute();
      }
      const isMuted = this.simpleUser.isMuted();
      if (this.currentActiveCallSession) {
        this.notifySession({ ...this.currentActiveCallSession, isMuted });
      }
      return isMuted;
    } else {
      if (this.localStream) {
        const audioTracks = this.localStream.getAudioTracks();
        const currentlyEnabled = audioTracks.length > 0 && audioTracks[0].enabled;
        const newEnabled = !currentlyEnabled;
        audioTracks.forEach((t) => (t.enabled = newEnabled));
        const isNowMuted = !newEnabled;
        if (this.currentActiveCallSession) {
          this.notifySession({ ...this.currentActiveCallSession, isMuted: isNowMuted });
        }
        return isNowMuted;
      }
    }
    return false;
  }

  public async toggleHold(): Promise<boolean> {
    if (this.config.transport === 'wss' && this.simpleUser) {
      try {
        if (this.simpleUser.isHeld()) {
          await this.simpleUser.unhold();
        } else {
          await this.simpleUser.hold();
        }
        const isHeld = this.simpleUser.isHeld();
        if (this.currentActiveCallSession) {
          this.notifySession({ ...this.currentActiveCallSession, isHeld, state: isHeld ? 'held' : 'connected' });
        }
        return isHeld;
      } catch (e) {
        console.warn('Hold error:', e);
      }
    } else {
      if (this.currentActiveCallSession) {
        const isHeld = !this.currentActiveCallSession.isHeld;
        this.notifySession({ ...this.currentActiveCallSession, isHeld, state: isHeld ? 'held' : 'connected' });
        const target = this.remotePeerExtension || this.currentActiveCallSession.remoteTarget;
        if (target && this.bridgeWs?.readyState === WebSocket.OPEN) {
          this.bridgeWs.send(
            JSON.stringify({
              type: 'call-held',
              target,
              held: isHeld,
            })
          );
        }
        return isHeld;
      }
    }
    return false;
  }

  public sendDtmf(digit: string) {
    if (this.config.transport === 'wss' && this.simpleUser) {
      try {
        this.simpleUser.sendDTMF(digit);
      } catch (e) {
        console.warn('DTMF error:', e);
      }
    } else {
      const target = this.remotePeerExtension || this.currentActiveCallSession?.remoteTarget;
      if (target && this.bridgeWs?.readyState === WebSocket.OPEN) {
        this.bridgeWs.send(
          JSON.stringify({
            type: 'dtmf',
            target,
            digit,
          })
        );
      }
    }
  }

  // =========================================================================
  // Browser Audio Diagnostics Loopback Test
  // =========================================================================
  public async testAudioLoopback(
    onProgress?: (stage: 'recording' | 'playing' | 'done', level: number) => void
  ): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<boolean>((resolve) => {
        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          onProgress?.('playing', 100);
          audio.onended = () => {
            onProgress?.('done', 0);
            resolve(true);
          };
          audio.onerror = () => {
            onProgress?.('done', 0);
            resolve(false);
          };
          audio.play().catch(() => resolve(false));
        };

        onProgress?.('recording', 70);
        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 3000);
      });
    } catch (e) {
      console.warn('Loopback mic test failed:', e);
      return false;
    }
  }

  private cleanupCall() {
    this.stopLocalAudioLevelMeter();
    this.stopRemoteAudioLevelMeter();
    this.pendingOffer = null;
    this.queuedIceCandidates = [];
    this.remotePeerExtension = null;

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch {}
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }
    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }
  }

  // =========================================================================
  // Live Microphone Audio Level Meter (Visual Feedback in Softphone)
  // =========================================================================
  private startLocalAudioLevelMeter() {
    if (!this.localStream || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.micStreamSource = this.audioContext.createMediaStreamSource(this.localStream);
      this.micStreamSource.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const checkAudio = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(Math.round((avg / 128) * 100), 100);
        this.audioLevelSubscribers.forEach((cb) => cb(normalized));
        this.animFrameId = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (e) {
      console.warn('Audio analyser notice:', e);
    }
  }

  private stopLocalAudioLevelMeter() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStreamSource) {
      try {
        this.micStreamSource.disconnect();
      } catch {}
      this.micStreamSource = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.audioLevelSubscribers.forEach((cb) => cb(0));
  }

  // =========================================================================
  // Live Remote Party Audio Level Meter (Inbound Voice Visualizer)
  // =========================================================================
  private startRemoteAudioLevelMeter(stream: MediaStream) {
    if (!stream || typeof window === 'undefined') return;
    try {
      this.stopRemoteAudioLevelMeter();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.remoteAudioContext = new AudioCtx();
      this.remoteAnalyser = this.remoteAudioContext.createAnalyser();
      this.remoteAnalyser.fftSize = 64;
      this.remoteAudioSource = this.remoteAudioContext.createMediaStreamSource(stream);
      this.remoteAudioSource.connect(this.remoteAnalyser);

      const dataArray = new Uint8Array(this.remoteAnalyser.frequencyBinCount);
      const checkAudio = () => {
        if (!this.remoteAnalyser) return;
        this.remoteAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(Math.round((avg / 128) * 100), 100);
        this.remoteAudioLevelSubscribers.forEach((cb) => cb(normalized));
        this.remoteAnimFrameId = requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (e) {
      console.warn('Remote audio analyser notice:', e);
    }
  }

  private stopRemoteAudioLevelMeter() {
    if (this.remoteAnimFrameId) {
      cancelAnimationFrame(this.remoteAnimFrameId);
      this.remoteAnimFrameId = null;
    }
    if (this.remoteAudioSource) {
      try {
        this.remoteAudioSource.disconnect();
      } catch {}
      this.remoteAudioSource = null;
    }
    if (this.remoteAudioContext) {
      try {
        this.remoteAudioContext.close();
      } catch {}
      this.remoteAudioContext = null;
    }
    this.remoteAudioLevelSubscribers.forEach((cb) => cb(0));
  }
}

export const sipManager = new SipTelephonyManager();

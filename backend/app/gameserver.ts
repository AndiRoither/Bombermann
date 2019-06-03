import Session from "./session"
import Player from "./player"

export default class GameServer {
    /**********************
     * Members
    ***********************/
    private serverPort: number = 4200

    private _openSessions: number = 0
    private _connectedSockets: number = 0
    private _connectedPlayers: number = 0

    private sessions: Array<Session> = []

    /**********************
     * Getter / Setter
    ***********************/

    public get openSessions() : number {
        return this._openSessions
    }

    
    public get connectedSockets() : number {
        return this._connectedSockets
    }

    
    public get connectedPlayers() : number {
        return this._connectedPlayers
    }
    
    /**********************
     * Functions
    ***********************/

    public createSession(socketId: string) {
        this.sessions.push(new Session(socketId))
    }

    public removeSession(session: Session) {
        var index = this.sessions.indexOf(session)
        if (index != undefined) {
            this.sessions.splice(index, 1)
        }
    }

    public removeSessionWithId(sessionId: number) {
        var index = this.getIndexForId(sessionId)
        if (index > -1) {
            this.sessions.splice(index, 1)
        }
    }

    public addPlayerToSession(player: Player, sessionId: number) {
        var index = this.getIndexForId(sessionId)
        if (index > -1) {
            this.sessions.splice(index, 1)
        }
    }

    public removePlayerFromSession(player: Player) {
        var index = this.getIndexForId(player.sessionId)
        if (index > -1) {
            this.sessions[index].removePlayer(player)
        }
    }

    private getIndexForId(sessionId: number): number {
        return this.sessions.findIndex((session) => session.id == sessionId)
    }
}
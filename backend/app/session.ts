import Player from "./player";

export default class Session {
    /**********************
     * Members
    ***********************/
    private _id: number
    private players: Array<Player> = [];

    constructor(socketId: string) {
        this._id = this.generateHashCode(socketId)
    }

    /**********************
     * Getter / Setter
    ***********************/
   
   public get id() : number {
       return this._id
   }
   

    /**********************
     * Functions
    ***********************/

    public addPlayer(player: Player) {
        this.players.push(player)
    }

    public removePlayer(player: Player) {
        var index = this.players.indexOf(player)
        if (index != undefined) {
            this.players.splice(index, 1)
        }
    }

    public removePlayerWithId(playerId: string) {
        var index = this.players.findIndex((player) => player.sessionId == playerId)
        if (index > -1) {
            this.players.splice(index, 1)
        }
    }

    private generateHashCode(socketId: string) {
        var hash = 0, i, chr
        if (socketId.length === 0) return hash
        for (i = 0; i < socketId.length; i++) {
            chr = socketId.charCodeAt(i)
            hash = ((hash << 5) - hash) + chr
            hash |= 0 // Convert to 32bit integer
        }
        return hash;
    }
}
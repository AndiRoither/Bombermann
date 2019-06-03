export default class Player {
    /**********************
     * Members
     ***********************/
    private _id: string = ""
    private _name: string
    private _sessionId: number = 0
    private _killCount: number = 0
    private _scorePoints: number = 0
    
    constructor(name: string) {
        this._name = name
    }
  
    /**********************
     * Getter / Setter
    ***********************/
    
    public get id() : string {
        return this._id
    }

    public get name() : string {
        return this._name
    }

    public set name(v : string) {
        this.name = v
    }
    
    public get sessionId() : number {
        return this._sessionId
    }
    
    public set sessionId(v : number) {
        this._sessionId = v;
    }
    
    public get killCount() : number {
        return this._killCount
    }
    
    public get scorePoints() : number {
        return this._scorePoints
    }

    /**********************
     * Functions
    ***********************/

    public increaseKillCount() {
        this._killCount++
    }
    
    public increaseScorePoints() {
        this._scorePoints++
    }
}
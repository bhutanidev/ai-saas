class ApiResponse {
    statusCode:number;
    success:boolean;
    data:any;
    message:string
    constructor(statusCode:number, data:any, message:string) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.data = data;
        this.message = message;
    }
}

export default ApiResponse;
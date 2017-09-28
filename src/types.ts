import * as Express from 'express'


interface ExtendedError extends Error {
	httpStatusHint?: number
	details?: any // TODO JSON
}

interface RequestWithUserId extends Express.Request {
	userId: string // to be set via session
}

interface RequestWithUUID extends Express.Request {
	uuid: string // module uuid
}

interface RequestWithParsedBody extends Express.Request {
	body: any // body parser TODO use JSON type
}

interface ExtendedRequest extends RequestWithUserId, RequestWithUUID, RequestWithParsedBody {
}

export {
	ExtendedError,
	RequestWithUserId,
	RequestWithUUID,
	RequestWithParsedBody,
	ExtendedRequest,
}

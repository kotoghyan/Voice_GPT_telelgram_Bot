import { unlink } from 'node:fs/promises'
export async function removeFile(path){
	try {
		await unlink(path)
	}catch (e) {
		console.log('Error remove file', e.message)
	}
}
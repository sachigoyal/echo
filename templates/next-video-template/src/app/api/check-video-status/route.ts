import { checkGeminiOperationStatus } from '../generate-video/gemini';

export async function POST(request: Request) {
  try {
    const { operationData } = await request.json();

    if (!operationData) {
      return Response.json(
        { error: 'operationData is required' },
        { status: 400 }
      );
    }

    return checkGeminiOperationStatus(operationData);
  } catch (error) {
    return Response.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
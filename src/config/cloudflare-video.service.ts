
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import FormData from "form-data";


interface CloudflareImageUploadResult {
  id: string;
  filename?: string;
  variants?: string[];
}

interface CloudflareImageUploadResponse {
  result: CloudflareImageUploadResult;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
}

@Injectable()
export class CloudflareService {
    /**
     * Delete image from Cloudflare Images
     */
    async deleteImageFromCloudflare(imageIdOrUrl: string): Promise<void> {
      try {
        // If a full URL is provided, extract the image ID
        let imageId = imageIdOrUrl;
        if (imageIdOrUrl.startsWith('http')) {
          // Example: https://imagedelivery.net/<account_hash>/<image_id>/public
          const parts = imageIdOrUrl.split('/');
          imageId = parts[parts.length - 2];
        }
        const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${imageId}`;
        const response = await this.http.delete(url, {
          headers: {
            Authorization: `Bearer ${this.imageToken}`,
          },
        });
        if (!response.data?.success) {
          throw new InternalServerErrorException('Cloudflare image delete failed');
        }
      } catch (error: unknown) {
        throw this.handleAxiosError(error, 'Cloudflare image delete failed');
      }
    }
  private readonly accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  private readonly imageToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
  private readonly http: AxiosInstance = axios;

  /**
   * Upload image to Cloudflare Images
   */
  async uploadImage(
    file: Buffer,
    fileName: string,
  ): Promise<CloudflareImageUploadResult> {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
      const form = new FormData();
      form.append("file", file, fileName);

      const formHeaders = form.getHeaders() as Record<string, string>;
      const response = await this.http.post<CloudflareImageUploadResponse>(
        url,
        form,
        {
          headers: {
            Authorization: `Bearer ${this.imageToken}`,
            ...formHeaders,
          },
        },
      );

      if (!response.data.success) {
        console.error("Cloudflare Image upload failed:", response.data.errors);
        throw new InternalServerErrorException(
          "Cloudflare Image upload failed",
        );
      }

      return response.data.result;
    } catch (error: unknown) {
      throw this.handleAxiosError(error, "Cloudflare Image upload failed");
    }
  }

  /**
   * Centralized error handler
   */
  private handleAxiosError(error: unknown, contextMessage: string): Error {
    if (axios.isAxiosError(error)) {
      type AxiosErrorData =
        | { errors?: Array<{ message?: string }> }
        | undefined;
      const data = error.response?.data as AxiosErrorData;
      const message = data?.errors?.[0]?.message ?? error.message;
      return new InternalServerErrorException(`${contextMessage}: ${message}`);
    }

    if (error instanceof Error) {
      return new InternalServerErrorException(
        `${contextMessage}: ${error.message}`,
      );
    }

    return new InternalServerErrorException(
      `${contextMessage}: ${String(error)}`,
    );
  }
}
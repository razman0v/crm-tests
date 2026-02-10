import { BaseService } from './base.service';
import { BranchPayload, BranchResponse } from '../../entities/branch.types';

export class BranchService extends BaseService {
  
  async create(name: string = `Auto Branch ${Date.now()}`): Promise<BranchResponse> {
    const headers = await this.getHeaders();
    
    const payload: BranchPayload = {
      companyId: null,
      title: name,
      glossaryCityId: 10,
      glossarySpecializationIds: [148],
      contacts: [],
      companyBranchCabinets: [
        {
          title: "Auto Cabinet",
          isActive: true,
          isStock: true
        }
      ]
    };

    const response = await this.request.post('/api/v1/branches', {
      headers,
      data: payload
    });

    if (!response.ok()) {
      await this.handleResponseError(response, 'Branch creation');
    }

    const created = await response.json() as BranchResponse;
    console.log(`✅ Branch Created: ID ${created.id} - ${created.title}`);
    
    // Fetch full details to ensure cabinets are populated
    return await this.getById(created.id);
  }

  async getById(id: number): Promise<BranchResponse> {
    const headers = await this.getHeaders();
    
    const response = await this.request.get(`/api/v1/branches/${id}`, {
      headers
    });
    
    if (!response.ok()) {
      await this.handleResponseError(response, `Branch retrieval (ID: ${id})`);
    }

    return await response.json() as BranchResponse;
  }
}
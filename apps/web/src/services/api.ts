
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await api.get<{
    success: boolean;
    data: Organization[];
  }>("/organizations");

  return response.data.data;
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const response = await api.post<{
    success: boolean;
    data: Organization;
  }>("/organizations", input);

  return response.data.data;
}

/**
 * HiveMQ Cloud API calls.
 */
import { hivemqClient } from './client';
import { HIVEMQ_ORG_ID, HIVEMQ_CLUSTER_ID } from '../constants/config';

export interface MqttCredentialsRequest {
  username: string;
  password: string;
}

export interface RoleRef {
  roleId: string;
  roleName: string;
}

export interface MqttUserInfo {
  role: string[];
  roleRefs: RoleRef[];
  username: string;
}

export interface CreateMqttCredentialsResponse {
  userInfo: MqttUserInfo;
}

export const hivemqApi = {
  async createMqttCredentials(
    credentials: MqttCredentialsRequest
  ): Promise<CreateMqttCredentialsResponse> {
    const url = `/api/v2/orgs/${HIVEMQ_ORG_ID}/clusters/${HIVEMQ_CLUSTER_ID}/mqtt/credentials`;
    const { data } = await hivemqClient.post<CreateMqttCredentialsResponse>(url, {
      credentials,
    });
    return data;
  },
};

export interface PersonaConnection {
  id: string; // character avatar
}

export interface PersonaDescription {
  description: string;
  lorebooks: string[];
  connections: PersonaConnection[];
  title: string;
}

export interface Persona extends PersonaDescription {
  avatarId: string;
  name: string;
}

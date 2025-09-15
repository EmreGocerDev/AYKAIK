import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  resetLink?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export default function PasswordResetEmail({ resetLink }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>AykaSosyal Şifre Sıfırlama</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/sidebarlogo.png`}
            width="150"
            height="42"
            alt="Ayka Enerji"
            style={logo}
          />
          <Text style={paragraph}>Merhaba,</Text>
          <Text style={paragraph}>
            AykaSosyal hesabınız için bir şifre sıfırlama talebi aldık. Yeni bir şifre oluşturmak için aşağıdaki butona tıklayabilirsiniz. Bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href={resetLink}>
              Şifremi Sıfırla
            </Button>
          </Section>
          <Text style={paragraph}>
            Saygılarımızla,
            <br />
            Ayka Enerji Ekibi
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// --- Stil Tanımlamaları ---
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
};
const logo = {
  margin: '0 auto',
};
const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
};
const btnContainer = {
  textAlign: 'center' as const,
};
const button = {
  backgroundColor: '#0891b2', // cyan-600
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
};
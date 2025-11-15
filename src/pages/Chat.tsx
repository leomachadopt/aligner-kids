import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Paperclip, SendHorizonal, Smile } from 'lucide-react'

const Chat = () => {
  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col animate-fade-in-up">
      <header className="flex items-center gap-4 border-b bg-card p-4">
        <Avatar>
          <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=doctor" />
          <AvatarFallback>DA</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-bold text-lg">Dra. Ana</h2>
          <p className="text-sm text-green-500">Online</p>
        </div>
      </header>
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-end gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=doctor" />
            <AvatarFallback>DA</AvatarFallback>
          </Avatar>
          <div className="max-w-xs rounded-lg rounded-bl-none bg-muted p-3">
            <p>
              Olá! Vi sua foto, está tudo ótimo com seu tratamento! Continue
              assim! 😄
            </p>
          </div>
        </div>
        <div className="flex items-end justify-end gap-2">
          <div className="max-w-xs rounded-lg rounded-br-none bg-primary p-3 text-primary-foreground">
            <p>Oba! Que bom! Obrigado, Doutora! ✨</p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=child" />
            <AvatarFallback>EU</AvatarFallback>
          </Avatar>
        </div>
      </main>
      <footer className="flex items-center gap-2 border-t bg-card p-4">
        <Button variant="ghost" size="icon">
          <Smile className="h-6 w-6" />
        </Button>
        <Input placeholder="Escreva sua mensagem..." className="h-12 text-lg" />
        <Button variant="ghost" size="icon">
          <Paperclip className="h-6 w-6" />
        </Button>
        <Button size="icon" className="h-12 w-12 shrink-0">
          <SendHorizonal className="h-6 w-6" />
        </Button>
      </footer>
    </div>
  )
}

export default Chat

import firebase from "firebase"
import { useEffect, useState } from "react"

interface IEntryDiary {
  date: string
  text: string
}

interface IRecordDiary {
  id: string
  date: string
  text: string
}

export const Home = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false)
  const [count, setCount] = useState<number>(0)
  const [displayName, setDisplayName] = useState<string>(null)
  const [email, setEmail] = useState<string>(null)
  const [diaryList, setDiaryList] = useState<IRecordDiary[]>([])

  useEffect(() => {
    if (firebase.apps.length != 0) return

    setLoading(true)
    const firebaseConfig = {
      apiKey: "AIzaSyAAa6TM3BHE45ze-hfPPbC5ZbnIswk6ah8",
      authDomain: "db-diary-ee778.firebaseapp.com",
      databaseURL: "https://db-diary-ee778-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "db-diary-ee778",
      storageBucket: "db-diary-ee778.appspot.com",
      messagingSenderId: "774708687419",
      appId: "1:774708687419:web:27ac01b6253bf44ebbe21e",
    }
    firebase.initializeApp(firebaseConfig)

    firebase.auth().onAuthStateChanged(async (user) => {
      setDisplayName(user?.displayName)
      setEmail(user?.email)
      setLoading(false)

      if (!user) {
        setDiaryList([])
        setLoading(false)
        return
      }

      firebase
        .app()
        .firestore()
        .collection("user")
        .doc(await firebase.app().auth().currentUser.uid)
        .collection("diary")
        .onSnapshot(async (snapshot) => {
          console.log({ snapshot })
          const list: IRecordDiary[] = []
          for (const d of snapshot.docs) {
            const data = (await d.data()) as IEntryDiary
            const record: IRecordDiary = {
              id: d.id,
              text: data.text,
              date: data.date,
            }
            list.push(record)
          }
          setDiaryList(list)
          setLoading(false)
        })
    })
  }, [])

  return (
    <>
      <h1>Home</h1>
      <span>{loading ? "loading" : "done"}</span>
      <span>
        {displayName}
        {email}
      </span>
      <button onClick={() => setCount(count + 1)}>Button {count}</button>

      <button
        onClick={async () => {
          const googleAuthProvider = new firebase.auth.GoogleAuthProvider()
          await firebase.app().auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
          await firebase.app().auth().signInWithRedirect(googleAuthProvider)
        }}
      >
        SignIn
      </button>

      <button
        onClick={async () => {
          await firebase.app().auth().signOut()
        }}
      >
        SignOut
      </button>

      <button
        onClick={async () => {
          const diaryEntry: IEntryDiary = {
            date: new Date().toISOString(),
            text: "hello world",
          }
          await firebase
            .app()
            .firestore()
            .collection("user")
            .doc(await firebase.app().auth().currentUser.uid)
            .collection("diary")
            .add(diaryEntry)
        }}
      >
        Create
      </button>

      {diaryList.map((i) => (
        <p key={i.id}>{i.date + " " + i.text}</p>
      ))}
    </>
  )
}
export default Home

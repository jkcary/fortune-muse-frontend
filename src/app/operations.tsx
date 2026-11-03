import { LocalizedText as Text } from "@/components/LocalizedText";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
  oracleStyles as s,
} from "@/components/OracleShell";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

export default function Operations() {
  const { me } = useSession();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const load = () => {
    void api("/oracle/admin/overview")
      .then((r) => {
        setData(r);
        setErr("");
      })
      .catch((e) => setErr(e.message));
  };
  useEffect(() => {
    if (me?.role === "admin") load();
  }, [me?.role]);
  return (
    <OracleShell>
      <View style={{ paddingTop: 40, gap: 22 }}>
        <Eyebrow>OPERATIONS</Eyebrow>
        <Display size={46}>Delivery, at a glance.</Display>
        {me?.role !== "admin" ? (
          <Panel>
            <Copy>
              Sign in with an administrator account to view delivery operations.
            </Copy>
            <Button title="Account" onPress={() => router.push("/profile")} />
          </Panel>
        ) : (
          <>
            <Button
              title="Refresh delivery status"
              kind="secondary"
              onPress={load}
            />
            <ErrorText>{err}</ErrorText>
            {data && (
              <>
                <Copy muted>
                  Content version: {data.contentVersion}. Showing the latest 100
                  delivery jobs. Provider payloads and private questions are
                  excluded.
                </Copy>
                <View style={s.row}>
                  {data.summary.map((r: any) => (
                    <Panel key={r.state}>
                      <Text style={s.label}>{r.state.toUpperCase()}</Text>
                      <Text style={s.subheading}>{r.count}</Text>
                    </Panel>
                  ))}
                </View>
                {data.jobs.map((job: any) => (
                  <Panel key={job.id}>
                    <Text style={s.label}>
                      {job.kind.toUpperCase()} · {job.state.toUpperCase()}
                    </Text>
                    <Text selectable style={s.small}>
                      Job {job.id} · attempts {job.attempts}
                    </Text>
                    <Text style={s.small}>
                      {new Date(job.updated_at).toLocaleString()}
                    </Text>
                    {job.last_error && (
                      <Text style={s.small}>{job.last_error}</Text>
                    )}
                    {job.state === "failed" && (
                      <Button
                        title="Retry failed delivery"
                        kind="secondary"
                        onPress={() =>
                          void api("/oracle/admin/jobs/" + job.id + "/retry", {
                            body: {},
                          })
                            .then(load)
                            .catch((e) => setErr(e.message))
                        }
                      />
                    )}
                  </Panel>
                ))}
              </>
            )}
          </>
        )}
      </View>
    </OracleShell>
  );
}
